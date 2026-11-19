import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO, STATUS_HORARIO } from '@/lib/constants'
import { criarNotificacao, msgSinalRejeitado } from '@/lib/notifications'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  let body: { motivo?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    // body opcional
  }
  const motivo = typeof body.motivo === 'string' && body.motivo.trim() ? body.motivo.trim() : null

  try {
    const agendamento = await db.agendamento.findUnique({
      where: { id },
      include: { horario: true, cliente: true, comprovante: true },
    })
    if (!agendamento) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })

    // Só a manicure dona do agendamento pode recusar
    if (agendamento.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Só agendamento aguardando sinal pode ser recusado
    if (agendamento.status !== STATUS_AGENDAMENTO.aguardando_sinal) {
      return NextResponse.json(
        { error: `Não é possível recusar um agendamento com status "${agendamento.status}"` },
        { status: 400 }
      )
    }

    const atualizado = await db.$transaction(async (tx) => {
      // Rejeita o comprovante
      if (agendamento.comprovante) {
        await tx.comprovanteSinal.update({
          where: { agendamentoId: id },
          data: { status: 'rejeitado', motivoRejeicao: motivo, avaliadoEm: new Date().toISOString() },
        })
      }

      // Libera o horário
      await tx.horarioDisponivel.update({
        where: { id: agendamento.horarioId },
        data: { status: STATUS_HORARIO.livre },
      })

      return tx.agendamento.update({
        where: { id },
        data: { status: STATUS_AGENDAMENTO.recusado, motivoRecusa: motivo },
      })
    })

    await criarNotificacao({
      usuarioId: agendamento.clienteId,
      agendamentoId: id,
      tipo: 'sinal_rejeitado',
      mensagem: msgSinalRejeitado(agendamento.cliente.nome, motivo || undefined),
    })

    return NextResponse.json({ agendamento: atualizado })
  } catch (e) {
    console.error('Erro ao recusar agendamento:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
