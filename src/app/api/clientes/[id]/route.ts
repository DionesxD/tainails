import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  const cliente = await db.usuario.findFirst({
    where: {
      id,
      tipo: 'cliente',
      agendamentosCliente: { some: { manicureId: user.id } },
    },
    select: { id: true, nome: true, telefone: true, email: true, eClienteConfianca: true },
  })
  if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const notas = await db.notaCliente.findMany({
    where: { clienteId: id, manicureId: user.id },
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json({ cliente, notas })
}
