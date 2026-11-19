import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword, verifyPassword } from '@/lib/password'

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: { senhaAtual?: unknown; novaSenha?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { senhaAtual, novaSenha } = body as { senhaAtual?: string; novaSenha?: string }

  // A senha atual é SEMPRE obrigatória — sessão roubada não permite
  // trocar a senha e persistir o acesso
  if (typeof senhaAtual !== 'string' || !senhaAtual) {
    return NextResponse.json({ error: 'Senha atual é obrigatória' }, { status: 400 })
  }
  if (typeof novaSenha !== 'string' || novaSenha.length < 8) {
    return NextResponse.json({ error: 'Nova senha deve ter no mínimo 8 caracteres' }, { status: 400 })
  }

  try {
    const fullUser = await db.usuario.findUnique({ where: { id: user.id } })
    if (!fullUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const ok = await verifyPassword(senhaAtual, fullUser.senhaHash)
    if (!ok) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })

    const senhaHash = await hashPassword(novaSenha)
    await db.usuario.update({ where: { id: user.id }, data: { senhaHash } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao trocar senha:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
