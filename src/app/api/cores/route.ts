import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const cores = await db.corEsmalte.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json({ cores })
}
