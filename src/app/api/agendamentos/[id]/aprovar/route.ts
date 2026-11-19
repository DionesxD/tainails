import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO } from '@/lib/constants'
import { criarNotificacao, msgSinalAprovado } from '@/lib/notifications'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  try {
    const agendamento = await db.agendamento.findUnique({
      where: { id },
      include: { horario: true, cliente: true, servico: true, comprovante: true },
    })
    if (!agendamento) return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
    if (agendamento.manicureId !== user.id) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    // Só aguardando sinal pode ser confirmado (evita "confirmar" cancelado/expirado)
    if (agendamento.status !== STATUS_AGENDAMENTO.aguardando_sinal) {
      return NextResponse.json(
        { error: `Não é possível aprovar um agendamento com status "${agendamento.status}"` },
        { status: 400 }
      )
    }

    const atualizado = await db.$transaction(async (tx) => {
      // Se tem comprovante, aprova o comprovante também
      if (agendamento.comprovante) {
        await tx.comprovanteSinal.update({
          where: { agendamentoId: id },
          data: { status: 'aprovado', avaliadoEm: new Date().toISOString() },
        })
      }

      return tx.agendamento.update({
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

    return NextResponse.json({ agendamento: atualizado })
  } catch (e) {
    console.error('Erro ao aprovar agendamento:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
