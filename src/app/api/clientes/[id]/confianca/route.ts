import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Marca/desmarca cliente de confiança.
// Regras: só manicure; alvo precisa ser cliente dela (com agendamento);
// resposta nunca expõe senhaHash.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  let body: { eClienteConfianca?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  if (typeof body.eClienteConfianca !== 'boolean') {
    return NextResponse.json({ error: 'eClienteConfianca deve ser booleano' }, { status: 400 })
  }

  try {
    const alvo = await db.usuario.findUnique({ where: { id } })
    if (!alvo || alvo.tipo !== 'cliente') {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Só pode alterar quem já agendou com ela
    const relacao = await db.agendamento.findFirst({
      where: { clienteId: alvo.id, manicureId: user.id },
      select: { id: true },
    })
    if (!relacao) {
      return NextResponse.json({ error: 'Este cliente nunca agendou com você' }, { status: 403 })
    }

    const atualizado = await db.usuario.update({
      where: { id },
      data: { eClienteConfianca: body.eClienteConfianca },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        tipo: true,
        fotoUrl: true,
        eClienteConfianca: true,
      },
    })

    return NextResponse.json({ user: atualizado })
  } catch (e) {
    console.error('Erro ao atualizar confiança:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
