import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  try {
    const existente = await db.galeriaModelo.findUnique({ where: { id } })
    if (!existente) return NextResponse.json({ error: 'Modelo não encontrado' }, { status: 404 })
    if (existente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (body.descricao !== undefined && typeof body.descricao !== 'string') {
      return NextResponse.json({ error: 'descricao deve ser string' }, { status: 400 })
    }
    if (body.ativo !== undefined && typeof body.ativo !== 'boolean') {
      return NextResponse.json({ error: 'ativo deve ser booleano' }, { status: 400 })
    }

    const modelo = await db.galeriaModelo.update({
      where: { id },
      data: {
        ...(body.descricao !== undefined && { descricao: body.descricao }),
        ...(body.tags !== undefined && { tags: body.tags ? JSON.stringify(body.tags) : null }),
        ...(body.ativo !== undefined && { ativo: body.ativo }),
      },
    })

    return NextResponse.json({ modelo })
  } catch (e) {
    console.error('Erro ao atualizar modelo da galeria:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  try {
    const existente = await db.galeriaModelo.findUnique({ where: { id } })
    if (!existente) return NextResponse.json({ error: 'Modelo não encontrado' }, { status: 404 })
    if (existente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    await db.galeriaModelo.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao excluir modelo da galeria:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
