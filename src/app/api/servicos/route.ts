import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const where = user.tipo === 'manicure' ? { manicureId: user.id } : {}
  const servicos = await db.servico.findMany({
    where: user.tipo === 'cliente' ? { ...where, ativo: true } : where,
    orderBy: { nome: 'asc' },
  })

  return NextResponse.json({ servicos })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: { nome?: unknown; descricao?: unknown; preco?: unknown; duracaoMinutos?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { nome, descricao, preco, duracaoMinutos } = body as {
    nome?: string; descricao?: string; preco?: number; duracaoMinutos?: number
  }
  if (typeof nome !== 'string' || !nome.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }
  // preco 0 é válido (serviço gratuito); só inválido se não-número ou negativo
  if (typeof preco !== 'number' || !Number.isFinite(preco) || preco < 0) {
    return NextResponse.json({ error: 'Preço deve ser um número ≥ 0' }, { status: 400 })
  }
  if (typeof duracaoMinutos !== 'number' || !Number.isInteger(duracaoMinutos) || duracaoMinutos <= 0) {
    return NextResponse.json({ error: 'Duração deve ser um inteiro > 0 (minutos)' }, { status: 400 })
  }

  try {
    const servico = await db.servico.create({
      data: {
        manicureId: user.id,
        nome: nome.trim(),
        descricao: typeof descricao === 'string' && descricao.trim() ? descricao.trim() : null,
        preco,
        duracaoMinutos,
      },
    })

    return NextResponse.json({ servico })
  } catch (e) {
    console.error('Erro ao criar serviço:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
