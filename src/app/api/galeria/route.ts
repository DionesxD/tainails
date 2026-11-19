import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const where = user.tipo === 'manicure' ? { manicureId: user.id } : {}
  const modelos = await db.galeriaModelo.findMany({
    where: user.tipo === 'cliente' ? { ...where, ativo: true } : where,
    orderBy: { criadoEm: 'desc' },
  })

  return NextResponse.json({
    modelos: modelos.map((m) => ({
      ...m,
      tags: m.tags ? JSON.parse(m.tags) : [],
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: { urlImagem?: unknown; descricao?: unknown; tags?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { urlImagem, descricao, tags } = body as {
    urlImagem?: string; descricao?: string; tags?: unknown
  }
  if (typeof urlImagem !== 'string' || !urlImagem) {
    return NextResponse.json({ error: 'URL da imagem é obrigatória' }, { status: 400 })
  }
  // Só aceita upload do próprio app ou URL https
  if (!urlImagem.startsWith('/uploads/') && !urlImagem.startsWith('https://')) {
    return NextResponse.json({ error: 'URL da imagem inválida' }, { status: 400 })
  }
  if (tags !== undefined && tags !== null && !Array.isArray(tags)) {
    return NextResponse.json({ error: 'tags deve ser uma lista' }, { status: 400 })
  }

  try {
    const modelo = await db.galeriaModelo.create({
      data: {
        manicureId: user.id,
        urlImagem,
        descricao: typeof descricao === 'string' && descricao.trim() ? descricao.trim() : null,
        tags: Array.isArray(tags) && tags.length ? JSON.stringify(tags) : null,
      },
    })

    return NextResponse.json({ modelo: { ...modelo, tags: modelo.tags ? JSON.parse(modelo.tags) : [] } })
  } catch (e) {
    console.error('Erro ao criar modelo da galeria:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
