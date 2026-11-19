import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: { nome?: unknown; telefone?: unknown; email?: unknown; fotoUrl?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { nome, telefone, email, fotoUrl } = body as {
    nome?: string; telefone?: string | null; email?: string | null; fotoUrl?: string | null
  }

  if (nome !== undefined && (typeof nome !== 'string' || !nome.trim())) {
    return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }
  // fotoUrl só pode ser upload do próprio app ou avatar externo https
  if (fotoUrl && typeof fotoUrl === 'string' && !fotoUrl.startsWith('/uploads/') && !fotoUrl.startsWith('https://')) {
    return NextResponse.json({ error: 'Foto inválida' }, { status: 400 })
  }

  try {
    // Checa duplicatas antes de atualizar
    if (telefone && telefone !== user.telefone) {
      const dup = await db.usuario.findUnique({ where: { telefone } })
      if (dup) return NextResponse.json({ error: 'Telefone já cadastrado' }, { status: 409 })
    }
    if (email && email !== user.email) {
      const dup = await db.usuario.findUnique({ where: { email } })
      if (dup) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const atualizado = await db.usuario.update({
      where: { id: user.id },
      data: {
        ...(nome && { nome: nome.trim() }),
        ...(telefone !== undefined && { telefone: telefone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(fotoUrl !== undefined && { fotoUrl: fotoUrl || null }),
      },
    })

    return NextResponse.json({
      user: {
        id: atualizado.id,
        nome: atualizado.nome,
        telefone: atualizado.telefone,
        email: atualizado.email,
        tipo: atualizado.tipo,
        fotoUrl: atualizado.fotoUrl,
        eClienteConfianca: atualizado.eClienteConfianca,
      },
    })
  } catch (e) {
    console.error('Erro ao atualizar perfil:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
