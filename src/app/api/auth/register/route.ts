import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  let body: { nome?: unknown; email?: unknown; telefone?: unknown; senha?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { nome, email, telefone, senha } = body as {
    nome?: string; email?: string; telefone?: string; senha?: string
  }
  if (!nome?.trim() || !senha || (!email && !telefone)) {
    return NextResponse.json({ error: 'Nome, senha e e-mail ou telefone são obrigatórios' }, { status: 400 })
  }
  if (senha.length < 8) {
    return NextResponse.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, { status: 400 })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }

  try {
    // Verifica duplicados
    if (email) {
      const existing = await db.usuario.findUnique({ where: { email } })
      if (existing) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }
    if (telefone) {
      const existing = await db.usuario.findUnique({ where: { telefone } })
      if (existing) return NextResponse.json({ error: 'Telefone já cadastrado' }, { status: 409 })
    }

    const senhaHash = await hashPassword(senha)
    const user = await db.usuario.create({
      data: {
        nome: nome.trim(),
        email: email || null,
        telefone: telefone || null,
        senhaHash,
        tipo: 'cliente',
      },
    })

    await createSession(user.id, user.tipo)

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        telefone: user.telefone,
        email: user.email,
        tipo: user.tipo,
        fotoUrl: user.fotoUrl,
        eClienteConfianca: user.eClienteConfianca,
      },
    })
  } catch (e) {
    console.error('Erro no registro:', e)
    return NextResponse.json({ error: 'Erro interno ao criar conta' }, { status: 500 })
  }
}
