import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword } from '@/lib/auth'

// A manicure do studio pode redefinir a senha de qualquer cliente cadastrada,
// inclusive antes do primeiro agendamento.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  let body: { novaSenha?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const novaSenha = body.novaSenha
  if (typeof novaSenha !== 'string' || novaSenha.length < 8) {
    return NextResponse.json({ error: 'Senha deve ter no mínimo 8 caracteres' }, { status: 400 })
  }

  try {
    const alvo = await db.usuario.findUnique({ where: { id } })
    if (!alvo || alvo.tipo !== 'cliente') {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    const senhaHash = await hashPassword(novaSenha)
    await db.usuario.update({ where: { id }, data: { senhaHash } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao redefinir senha do cliente:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
