import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'
import { STATUS_AGENDAMENTO, STATUS_HORARIO } from '@/lib/constants'
import { criarNotificacao } from '@/lib/notifications'
import crypto from 'crypto'

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/

function somarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + minutos
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

// Agendamento manual: para quem agenda fora da plataforma (telefone ou
// pessoalmente). A manicure escolhe a cliente (cadastrada ou nova, criada
// com senha temporária), a data/hora de início e o serviço. O horário é
// criado já como reservado e o agendamento entra como confirmado.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: {
    clienteId?: unknown
    novaCliente?: unknown
    servicoId?: unknown
    data?: unknown
    horaInicio?: unknown
    observacoes?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { clienteId, servicoId } = body as { clienteId?: string; servicoId?: string }
  const novaCliente = body.novaCliente as
    | { nome?: unknown; telefone?: unknown; email?: unknown }
    | undefined

  if (!clienteId && !novaCliente) {
    return NextResponse.json({ error: 'Selecione uma cliente ou informe os dados da nova cliente' }, { status: 400 })
  }
  if (!servicoId || typeof servicoId !== 'string') {
    return NextResponse.json({ error: 'Serviço é obrigatório' }, { status: 400 })
  }
  if (typeof body.data !== 'string' || !REGEX_DATA.test(body.data)) {
    return NextResponse.json({ error: 'Data inválida (formato AAAA-MM-DD)' }, { status: 400 })
  }
  if (typeof body.horaInicio !== 'string' || !REGEX_HORA.test(body.horaInicio)) {
    return NextResponse.json({ error: 'Hora inválida (formato HH:MM)' }, { status: 400 })
  }
  const observacoes =
    typeof body.observacoes === 'string' && body.observacoes.trim() ? body.observacoes.trim() : null

  // Tipos já validados acima — capturados para uso dentro da transação
  const dataAgendamento = body.data as string
  const horaInicio = body.horaInicio as string

  try {
    const servico = await db.servico.findUnique({ where: { id: servicoId } })
    if (!servico || servico.manicureId !== user.id) {
      return NextResponse.json({ error: 'Serviço inválido' }, { status: 400 })
    }

    const horaFim = somarMinutos(horaInicio, servico.duracaoMinutos)

    const agendamento = await db.$transaction(async (tx) => {
      // 1. Resolve a cliente: existente ou nova
      let clienteIdFinal: string
      let senhaTemporaria: string | null = null
      let nomeCliente: string

      if (clienteId) {
        const cliente = await tx.usuario.findUnique({ where: { id: clienteId } })
        if (!cliente || cliente.tipo !== 'cliente') {
          throw new Error('CLIENTE_INVALIDA')
        }
        clienteIdFinal = cliente.id
        nomeCliente = cliente.nome
      } else {
        const nome = typeof novaCliente?.nome === 'string' ? novaCliente.nome.trim() : ''
        const telefone = typeof novaCliente?.telefone === 'string' ? novaCliente.telefone.trim() : ''
        const email = typeof novaCliente?.email === 'string' ? novaCliente.email.trim().toLowerCase() : ''
        if (!nome) throw new Error('NOME_OBRIGATORIO')
        if (!telefone && !email) throw new Error('CONTATO_OBRIGATORIO')
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('EMAIL_INVALIDO')

        if (email) {
          const dup = await tx.usuario.findUnique({ where: { email } })
          if (dup) throw new Error('EMAIL_EM_USO')
        }
        if (telefone) {
          const dup = await tx.usuario.findUnique({ where: { telefone } })
          if (dup) throw new Error('TELEFONE_EM_USO')
        }

        senhaTemporaria = crypto.randomBytes(4).toString('hex')
        const nova = await tx.usuario.create({
          data: {
            nome,
            telefone: telefone || null,
            email: email || null,
            senhaHash: await hashPassword(senhaTemporaria),
            tipo: 'cliente',
          },
        })
        clienteIdFinal = nova.id
        nomeCliente = nova.nome
      }

      // 2. Conflito de horário para a própria manicure no dia/hora
      const horariosDoDia = await tx.horarioDisponivel.findMany({
        where: { manicureId: user.id, data: dataAgendamento },
      })
      const conflito = horariosDoDia.find((h) => {
        if (h.status !== STATUS_HORARIO.reservado) return false
        return horaInicio < h.horaFim && horaFim > h.horaInicio
      })
      if (conflito) throw new Error('HORARIO_OCUPADO')

      // 3. Resolve o horário: reutiliza slot livre com o mesmo início
      // (a manicure costuma criar slots em Horários) ou cria um novo já
      // reservado. Slot livre só serve se comportar a duração do serviço.
      const slotExistente = horariosDoDia.find(
        (h) => h.horaInicio === horaInicio && h.status === STATUS_HORARIO.livre
      )
      let horario
      if (slotExistente) {
        if (horaFim > slotExistente.horaFim) throw new Error('SLOT_CURTO')
        horario = await tx.horarioDisponivel.update({
          where: { id: slotExistente.id },
          data: { status: STATUS_HORARIO.reservado },
        })
      } else {
        horario = await tx.horarioDisponivel.create({
          data: {
            manicureId: user.id,
            data: dataAgendamento,
            horaInicio,
            horaFim,
            status: STATUS_HORARIO.reservado,
          },
        })
      }

      // 4. Cria o agendamento confirmado
      const novo = await tx.agendamento.create({
        data: {
          clienteId: clienteIdFinal,
          manicureId: user.id,
          horarioId: horario.id,
          servicoId,
          status: STATUS_AGENDAMENTO.confirmado,
          observacoesCliente: observacoes,
        },
        include: { servico: true, horario: true },
      })

      return { novo, nomeCliente, senhaTemporaria }
    })

    // Notifica a cliente (fora da transação — efeito colateral)
    await criarNotificacao({
      usuarioId: agendamento.novo.clienteId,
      agendamentoId: agendamento.novo.id,
      tipo: 'agendamento_confirmado',
      mensagem: `Agendamento manual: ${servico.nome} em ${dataAgendamento.split('-').reverse().join('/')} às ${horaInicio}.`,
    })

    return NextResponse.json({
      agendamento: agendamento.novo,
      ...(agendamento.senhaTemporaria && { senhaTemporaria: agendamento.senhaTemporaria }),
    })
  } catch (e) {
    const mensagens: Record<string, string> = {
      CLIENTE_INVALIDA: 'Cliente não encontrada',
      NOME_OBRIGATORIO: 'Nome da nova cliente é obrigatório',
      CONTATO_OBRIGATORIO: 'Informe telefone ou e-mail da nova cliente',
      EMAIL_INVALIDO: 'E-mail inválido',
      EMAIL_EM_USO: 'E-mail já cadastrado',
      TELEFONE_EM_USO: 'Telefone já cadastrado',
      HORARIO_OCUPADO: 'Você já tem atendimento nesse horário',
      SLOT_CURTO: 'O horário livre desse início é mais curto que a duração do serviço',
    }
    const codigo = e instanceof Error && mensagens[e.message] ? e.message : null
    if (codigo) {
      return NextResponse.json({ error: mensagens[codigo] }, { status: 400 })
    }
    console.error('Erro ao criar agendamento manual:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
