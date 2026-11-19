import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (user.tipo === 'manicure') {
    // O Tainails opera com uma única manicure: todas as clientes cadastradas
    // pertencem à carteira do studio, mesmo antes do primeiro agendamento.
    const clientes = await db.usuario.findMany({
      where: { tipo: 'cliente' },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        eClienteConfianca: true,
        agendamentosCliente: {
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json({
      clientes: clientes.map(({ agendamentosCliente, ...cliente }) => ({
        ...cliente,
        jaAgendou: agendamentosCliente.length > 0,
      })),
    })
  }

  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
}
