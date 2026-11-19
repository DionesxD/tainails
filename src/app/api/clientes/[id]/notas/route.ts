import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  let body: { observacao?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  if (typeof body.observacao !== 'string' || !body.observacao.trim()) {
    return NextResponse.json({ error: 'Observação é obrigatória' }, { status: 400 })
  }
  if (body.observacao.length > 2000) {
    return NextResponse.json({ error: 'Observação muito longa (máx. 2000 caracteres)' }, { status: 400 })
  }

  try {
    // Alvo precisa ser cliente que já agendou com esta manicure
    const alvo = await db.usuario.findUnique({ where: { id } })
    if (!alvo || alvo.tipo !== 'cliente') {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }
    const relacao = await db.agendamento.findFirst({
      where: { clienteId: alvo.id, manicureId: user.id },
      select: { id: true },
    })
    if (!relacao) {
      return NextResponse.json({ error: 'Este cliente nunca agendou com você' }, { status: 403 })
    }

    const nota = await db.notaCliente.create({
      data: { clienteId: id, manicureId: user.id, observacao: body.observacao.trim() },
    })

    return NextResponse.json({ nota })
  } catch (e) {
    console.error('Erro ao criar nota:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
