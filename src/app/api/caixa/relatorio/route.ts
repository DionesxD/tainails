import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Caixa é da manicure apenas
  if (user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const transacoes = await db.transacaoCaixa.findMany({
      where: { manicureId: user.id },
      orderBy: { data: 'desc' },
      include: {
        agendamento: { select: { servico: { select: { nome: true } } } },
      },
      take: 1000,
    })

    return NextResponse.json({ transacoes })
  } catch (e) {
    console.error('Erro ao gerar relatório do caixa:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
