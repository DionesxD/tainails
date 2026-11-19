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
    const existente = await db.servico.findUnique({ where: { id } })
    if (!existente) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    if (existente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (body.nome !== undefined && (typeof body.nome !== 'string' || !body.nome.trim())) {
      return NextResponse.json({ error: 'nome inválido' }, { status: 400 })
    }
    if (body.preco !== undefined && (typeof body.preco !== 'number' || !Number.isFinite(body.preco) || body.preco < 0)) {
      return NextResponse.json({ error: 'preco deve ser um número ≥ 0' }, { status: 400 })
    }
    if (
      body.duracaoMinutos !== undefined &&
      (typeof body.duracaoMinutos !== 'number' || !Number.isInteger(body.duracaoMinutos) || body.duracaoMinutos <= 0)
    ) {
      return NextResponse.json({ error: 'duracaoMinutos deve ser um inteiro > 0' }, { status: 400 })
    }
    if (body.ativo !== undefined && typeof body.ativo !== 'boolean') {
      return NextResponse.json({ error: 'ativo deve ser booleano' }, { status: 400 })
    }

    const servico = await db.servico.update({
      where: { id },
      data: {
        ...(body.nome && { nome: body.nome }),
        ...(body.descricao !== undefined && { descricao: body.descricao }),
        ...(body.preco !== undefined && { preco: body.preco }),
        ...(body.duracaoMinutos !== undefined && { duracaoMinutos: body.duracaoMinutos }),
        ...(body.ativo !== undefined && { ativo: body.ativo }),
      },
    })

    return NextResponse.json({ servico })
  } catch (e) {
    console.error('Erro ao atualizar serviço:', e)
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
    const existente = await db.servico.findUnique({ where: { id } })
    if (!existente) return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 })
    if (existente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    await db.servico.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao excluir serviço:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
