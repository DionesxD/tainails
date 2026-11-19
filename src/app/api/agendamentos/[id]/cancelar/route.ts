import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO, STATUS_HORARIO } from '@/lib/constants'
import { criarNotificacao, msgCancelado } from '@/lib/notifications'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params

  try {
    const agendamento = await db.agendamento.findUnique({
      where: { id },
      include: { horario: true, cliente: true },
    })
    if (!agendamento) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

    // Cliente só pode cancelar os próprios; manicure pode cancelar agendamentos dela
    if (user.tipo === 'cliente' && agendamento.clienteId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    if (user.tipo === 'manicure' && agendamento.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Apenas agendamentos em espera de sinal ou confirmados podem ser cancelados
    const statusPermitidos: string[] = [STATUS_AGENDAMENTO.aguardando_sinal, STATUS_AGENDAMENTO.confirmado]
    if (!statusPermitidos.includes(agendamento.status)) {
      return NextResponse.json(
        { error: `Não é possível cancelar um agendamento com status "${agendamento.status}"` },
        { status: 400 }
      )
    }

    // Libera o horário
    await db.horarioDisponivel.update({
      where: { id: agendamento.horarioId },
      data: { status: STATUS_HORARIO.livre },
    })

    const atualizado = await db.agendamento.update({
      where: { id },
      data: { status: STATUS_AGENDAMENTO.cancelado },
    })

    // Notifica a outra parte
    const notifyUserId = user.tipo === 'cliente' ? agendamento.manicureId : agendamento.clienteId
    const dataHora = `${agendamento.horario.data.split('-').reverse().join('/')} às ${agendamento.horario.horaInicio}`
    await criarNotificacao({
      usuarioId: notifyUserId,
      agendamentoId: id,
      tipo: 'agendamento_cancelado',
      mensagem: msgCancelado(agendamento.cliente.nome, dataHora),
    })

    return NextResponse.json({ agendamento: atualizado })
  } catch (e) {
    console.error('Erro ao cancelar agendamento:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
