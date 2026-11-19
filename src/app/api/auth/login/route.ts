import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { identifier, senha } = await req.json()
    if (!identifier || !senha) {
      return NextResponse.json({ error: 'Credenciais obrigatórias' }, { status: 400 })
    }

    const user = await db.usuario.findFirst({
      where: {
        OR: [{ email: identifier }, { telefone: identifier }],
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const ok = await verifyPassword(senha, user.senhaHash)
    if (!ok) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

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
    console.error('Erro no login:', e)
    return NextResponse.json({ error: 'Erro interno ao realizar login' }, { status: 500 })
  }
}
