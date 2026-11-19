import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Manicure corrige o e-mail de uma cliente (erros de digitação no cadastro).
// Regras: só manicure; alvo precisa ser cliente; e-mail válido e único
// (vazio limpa o e-mail); resposta nunca expõe senhaHash.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  let body: { email?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const email = body.email
  if (typeof email !== 'string') {
    return NextResponse.json({ error: 'email deve ser uma string' }, { status: 400 })
  }
  const emailLimpo = email.trim().toLowerCase()
  // String vazia limpa o e-mail; caso contrário precisa ser válido
  if (emailLimpo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }

  try {
    const alvo = await db.usuario.findUnique({ where: { id } })
    if (!alvo || alvo.tipo !== 'cliente') {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    if (emailLimpo) {
      const duplicado = await db.usuario.findUnique({ where: { email: emailLimpo } })
      if (duplicado && duplicado.id !== id) {
        return NextResponse.json({ error: 'Este e-mail já está em uso por outra conta' }, { status: 409 })
      }
    }

    const atualizado = await db.usuario.update({
      where: { id },
      data: { email: emailLimpo || null },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        eClienteConfianca: true,
      },
    })

    return NextResponse.json({ user: atualizado })
  } catch (e) {
    console.error('Erro ao atualizar e-mail da cliente:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
