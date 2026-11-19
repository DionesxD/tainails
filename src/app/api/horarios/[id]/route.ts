import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_AGENDAMENTO, STATUS_HORARIO, type StatusHorario } from '@/lib/constants'

const STATUS_VALIDOS: StatusHorario[] = ['livre', 'reservado', 'bloqueado']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  let body: { status?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  if (typeof body.status !== 'string' || !STATUS_VALIDOS.includes(body.status as StatusHorario)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  try {
    const horarioExistente = await db.horarioDisponivel.findUnique({ where: { id } })
    if (!horarioExistente) {
      return NextResponse.json({ error: 'Horário não encontrado' }, { status: 404 })
    }
    if (horarioExistente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Não liberar horário que ainda tem agendamento ativo
    if (body.status === STATUS_HORARIO.livre) {
      const agAtivo = await db.agendamento.findFirst({
        where: {
          horarioId: id,
          status: { in: [STATUS_AGENDAMENTO.aguardando_sinal, STATUS_AGENDAMENTO.confirmado] },
        },
        select: { id: true },
      })
      if (agAtivo) {
        return NextResponse.json(
          { error: 'Este horário possui agendamento ativo — cancele o agendamento primeiro' },
          { status: 400 }
        )
      }
    }

    const horario = await db.horarioDisponivel.update({
      where: { id },
      data: { status: body.status },
    })

    return NextResponse.json({ horario })
  } catch (e) {
    console.error('Erro ao atualizar horário:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }
  const { id } = await params

  try {
    const horarioExistente = await db.horarioDisponivel.findUnique({ where: { id } })
    if (!horarioExistente) {
      return NextResponse.json({ error: 'Horário não encontrado' }, { status: 404 })
    }
    if (horarioExistente.manicureId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    await db.horarioDisponivel.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao excluir horário:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
