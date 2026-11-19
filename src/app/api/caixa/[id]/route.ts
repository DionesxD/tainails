import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Exclui um lançamento MANUAL do caixa (sem agendamento vinculado).
// Transações vindas de atendimentos só saem dali — mantém o caixa
// casando com os agendamentos concluídos.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  try {
    const transacao = await db.transacaoCaixa.findUnique({ where: { id } })
    if (!transacao || transacao.manicureId !== user.id) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }
    if (transacao.agendamentoId) {
      return NextResponse.json(
        { error: 'Transação de atendimento não pode ser excluída aqui' },
        { status: 400 }
      )
    }

    await db.transacaoCaixa.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao excluir transação:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
