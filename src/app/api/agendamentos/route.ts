import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, getConfiguracoes } from '@/lib/auth'
import { STATUS_AGENDAMENTO, STATUS_HORARIO } from '@/lib/constants'
import { criarNotificacao, msgConfirmado } from '@/lib/notifications'
import { resolveProofUrl, supabaseProofReferencePrefix } from '@/lib/supabase-storage'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: { clienteId?: string; manicureId?: string; status?: string } = {}

  if (user.tipo === 'cliente') {
    where.clienteId = user.id
  } else {
    where.manicureId = user.id
  }
  if (status) where.status = status

  const agendamentos = await db.agendamento.findMany({
    where,
    orderBy: { criadoEm: 'desc' },
    include: {
      servico: { select: { id: true, nome: true, preco: true, duracaoMinutos: true } },
      corEsmalte: { select: { id: true, nome: true, hex: true } },
      horario: { select: { id: true, data: true, horaInicio: true, horaFim: true } },
      cliente: { select: { id: true, nome: true, telefone: true, email: true, eClienteConfianca: true } },
      comprovante: true,
    },
  })
  const comLinksDosComprovantes = await Promise.all(agendamentos.map(async (agendamento) => {
    if (!agendamento.comprovante) return agendamento
    try {
      return {
        ...agendamento,
        comprovante: {
          ...agendamento.comprovante,
          urlComprovante: await resolveProofUrl(agendamento.comprovante.urlComprovante),
        },
      }
    } catch (error) {
      console.error('Erro ao gerar link do comprovante:', error)
      return { ...agendamento, comprovante: { ...agendamento.comprovante, urlComprovante: null } }
    }
  }))
  return NextResponse.json({ agendamentos: comLinksDosComprovantes })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'cliente') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  let body: {
    horarioId?: unknown
    servicoId?: unknown
    corEsmalteId?: unknown
    observacoes?: unknown
    comprovanteUrl?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { horarioId, servicoId } = body as { horarioId?: string; servicoId?: string }
  const corEsmalteId = typeof body.corEsmalteId === 'string' && body.corEsmalteId ? body.corEsmalteId : null
  const observacoes = typeof body.observacoes === 'string' && body.observacoes.trim() ? body.observacoes.trim() : null
  const comprovanteUrl = typeof body.comprovanteUrl === 'string' && body.comprovanteUrl ? body.comprovanteUrl : null

  if (!horarioId || !servicoId) {
    return NextResponse.json({ error: 'Horário e serviço são obrigatórios' }, { status: 400 })
  }
  // Comprovantes Supabase precisam pertencer à cliente autenticada.
  const privateUpload = comprovanteUrl?.startsWith(`${supabaseProofReferencePrefix}${user.id}/`) ?? false
  const localUpload = process.env.NODE_ENV === 'development' && (comprovanteUrl?.startsWith('/uploads/') ?? false)
  if (comprovanteUrl && !privateUpload && !localUpload) {
    return NextResponse.json({ error: 'Comprovante inválido' }, { status: 400 })
  }

  try {
    // Validate service outside transaction (read-only, no race condition risk)
    const servico = await db.servico.findUnique({ where: { id: servicoId } })
    if (!servico || !servico.ativo) {
      return NextResponse.json({ error: 'Serviço inválido' }, { status: 400 })
    }

    // Cor de esmalte, se informada, precisa existir
    if (corEsmalteId) {
      const cor = await db.corEsmalte.findUnique({ where: { id: corEsmalteId } })
      if (!cor) return NextResponse.json({ error: 'Cor de esmalte inválida' }, { status: 400 })
    }

    // Run the critical section atomically to prevent race conditions
    const agendamento = await db.$transaction(async (tx) => {
      // 1. Fetch and lock the time slot
      const horario = await tx.horarioDisponivel.findUnique({ where: { id: horarioId } })
      if (!horario || horario.status !== STATUS_HORARIO.livre) {
        throw new Error('HORARIO_INDISPONIVEL')
      }

      // 2. Serviço precisa pertencer à mesma manicure do horário
      if (servico.manicureId !== horario.manicureId) {
        throw new Error('SERVICO_INVALIDO')
      }

      // 3. Check for conflicting booking — apenas status ATIVOS bloqueiam o slot;
      //    agendamentos cancelados/recusados/expirados/concluídos não impedem novo agendamento
      const conflito = await tx.agendamento.findFirst({
        where: {
          horarioId,
          status: { in: [STATUS_AGENDAMENTO.aguardando_sinal, STATUS_AGENDAMENTO.confirmado] },
        },
      })
      if (conflito) {
        throw new Error('HORARIO_JA_AGENDADO')
      }

      // 4. Fetch business config (dentro da transação)
      const config = await getConfiguracoes(horario.manicureId, tx)
      const eConfianca = user.eClienteConfianca
      // Cliente de confiança OU manicure que não exige sinal → confirmado direto
      const novoStatus =
        eConfianca || !config.exigeSinal
          ? STATUS_AGENDAMENTO.confirmado
          : STATUS_AGENDAMENTO.aguardando_sinal

      const valorSinal =
        config.exigeSinal && !eConfianca
          ? servico.preco * (config.percentualSinal / 100)
          : null
      const sinalExpiraEm = valorSinal
        ? new Date(Date.now() + config.prazoEnvioSinalHoras * 60 * 60 * 1000).toISOString()
        : null

      // 5. Create the booking
      const novoAgendamento = await tx.agendamento.create({
        data: {
          clienteId: user.id,
          manicureId: horario.manicureId,
          horarioId,
          servicoId,
          corEsmalteId: corEsmalteId || null,
          status: novoStatus,
          confirmadoAutomaticamente: eConfianca,
          observacoesCliente: observacoes,
          valorSinal,
          sinalExpiraEm,
        },
        include: { servico: true, corEsmalte: true, horario: true },
      })

      // 6. Mark time slot as reserved
      await tx.horarioDisponivel.update({
        where: { id: horarioId },
        data: { status: STATUS_HORARIO.reservado },
      })

      return novoAgendamento
    })

    // Outside transaction: create receipt and send notifications (non-atomic side effects)
    if (comprovanteUrl && agendamento.valorSinal) {
      await db.comprovanteSinal.create({
        data: {
          agendamentoId: agendamento.id,
          urlComprovante: comprovanteUrl,
          status: 'pendente',
          enviadoEm: new Date().toISOString(),
        },
      })
    }

    const dataHora = `${agendamento.horario.data.split('-').reverse().join('/')} às ${agendamento.horario.horaInicio}`
    const eConfianca = user.eClienteConfianca

    if (eConfianca) {
      await criarNotificacao({
        usuarioId: user.id,
        agendamentoId: agendamento.id,
        tipo: 'agendamento_confirmado',
        mensagem: msgConfirmado(user.nome, dataHora),
      })
      await criarNotificacao({
        usuarioId: agendamento.manicureId,
        agendamentoId: agendamento.id,
        tipo: 'agendamento_confirmado',
        mensagem: `Novo agendamento confirmado automaticamente (cliente de confiança): ${user.nome} em ${dataHora}.`,
      })
    } else if (comprovanteUrl) {
      await criarNotificacao({
        usuarioId: agendamento.manicureId,
        agendamentoId: agendamento.id,
        tipo: 'agendamento_confirmado',
        mensagem: `Novo comprovante de sinal de ${user.nome} para ${dataHora}. Aprovar no painel.`,
      })
    }

    return NextResponse.json({ agendamento })
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message === 'HORARIO_INDISPONIVEL') {
        return NextResponse.json({ error: 'Horário indisponível' }, { status: 400 })
      }
      if (e.message === 'HORARIO_JA_AGENDADO') {
        return NextResponse.json({ error: 'Horário já possui agendamento' }, { status: 400 })
      }
      if (e.message === 'SERVICO_INVALIDO') {
        return NextResponse.json({ error: 'Este serviço não pertence a esta manicure' }, { status: 400 })
      }
    }
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
