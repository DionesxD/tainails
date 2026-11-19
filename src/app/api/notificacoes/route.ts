import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filtro = searchParams.get('filtro')

  const where: { usuarioId: string; lida?: boolean; tipo?: string } = { usuarioId: user.id }
  if (filtro === 'naolidas') where.lida = false
  else if (filtro && filtro !== 'todas') where.tipo = filtro

  const notificacoes = await db.notificacao.findMany({
    where,
    orderBy: { enviadaEm: 'desc' },
    take: 50,
  })

  return NextResponse.json({ notificacoes })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: { id?: string; lida?: boolean } | null = null
  try { body = await req.json() } catch { body = null }

  if (!body || !body.id) {
    await db.notificacao.updateMany({
      where: { usuarioId: user.id, lida: false },
      data: { lida: true },
    })
    return NextResponse.json({ ok: true, modo: 'todas' })
  }

  const lida = body.lida ?? true
  await db.notificacao.updateMany({
    where: { id: body.id, usuarioId: user.id },
    data: { lida },
  })
  return NextResponse.json({ ok: true, modo: 'individual', id: body.id, lida })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: { id?: string } | null = null
  try { body = await req.json() } catch { body = null }

  if (!body || !body.id) {
    await db.notificacao.deleteMany({ where: { usuarioId: user.id } })
    return NextResponse.json({ ok: true, modo: 'todas' })
  }

  await db.notificacao.deleteMany({
    where: { id: body.id, usuarioId: user.id },
  })
  return NextResponse.json({ ok: true, modo: 'individual', id: body.id })
}
