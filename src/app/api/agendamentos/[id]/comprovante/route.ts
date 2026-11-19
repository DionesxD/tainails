import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO } from '@/lib/constants'
import { criarNotificacao, msgSinalAprovado, msgSinalRejeitado } from '@/lib/notifications'

// POST /api/agendamentos/[id]/comprovante — aprovar ou rejeitar comprovante
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  let body: { acao?: unknown; motivo?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const acao = body.acao
  if (acao !== 'aprovar' && acao !== 'rejeitar') {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }
  const motivo = typeof body.motivo === 'string' && body.motivo.trim() ? body.motivo.trim() : null

  try {
    const agendamento = await db.agendamento.findUnique({
      where: { id },
      include: { horario: true, cliente: true, comprovante: true },
    })
    if (!agendamento) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    if (!agendamento.comprovante) return NextResponse.json({ error: 'Sem comprovante' }, { status: 400 })

    // Só a manicure dona do agendamento avalia o comprovante
    if (agendamento.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Comprovante só pode ser avaliado uma vez
    if (agendamento.comprovante.status !== 'pendente') {
      return NextResponse.json(
        { error: `Comprovante já ${agendamento.comprovante.status}` },
        { status: 400 }
      )
    }

    if (acao === 'aprovar') {
      await db.$transaction(async (tx) => {
        await tx.comprovanteSinal.update({
          where: { agendamentoId: id },
          data: { status: 'aprovado', avaliadoEm: new Date().toISOString() },
        })
        await tx.agendamento.update({
          where: { id },
          data: { status: STATUS_AGENDAMENTO.confirmado },
        })
      })
      const dataHora = `${agendamento.horario.data.split('-').reverse().join('/')} às ${agendamento.horario.horaInicio}`
      await criarNotificacao({
        usuarioId: agendamento.clienteId,
        agendamentoId: id,
        tipo: 'sinal_aprovado',
        mensagem: msgSinalAprovado(agendamento.cliente.nome, dataHora),
      })
      return NextResponse.json({ ok: true, acao: 'aprovado' })
    }

    // rejeitar
    await db.comprovanteSinal.update({
      where: { agendamentoId: id },
      data: { status: 'rejeitado', motivoRejeicao: motivo, avaliadoEm: new Date().toISOString() },
    })
    await criarNotificacao({
      usuarioId: agendamento.clienteId,
      agendamentoId: id,
      tipo: 'sinal_rejeitado',
      mensagem: msgSinalRejeitado(agendamento.cliente.nome, motivo || undefined),
    })
    return NextResponse.json({ ok: true, acao: 'rejeitado' })
  } catch (e) {
    console.error('Erro ao avaliar comprovante:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
