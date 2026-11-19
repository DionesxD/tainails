import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  if (user.tipo === 'manicure') {
    // Manicure vê todos os seus clientes
    const clientes = await db.usuario.findMany({
      where: {
        tipo: 'cliente',
        agendamentosCliente: { some: { manicureId: user.id } },
      },
      select: {
        id: true, nome: true, telefone: true, email: true, eClienteConfianca: true,
      },
      orderBy: { nome: 'asc' },
    })
    return NextResponse.json({ clientes })
  }

  // Cliente não precisa listar clientes
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
}
