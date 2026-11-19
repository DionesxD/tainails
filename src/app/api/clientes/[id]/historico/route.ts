import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  const historico = await db.historicoAtendimento.findMany({
    where: { clienteId: id, manicureId: user.id },
    orderBy: { dataAtendimento: 'desc' },
  })

  return NextResponse.json({ historico })
}
