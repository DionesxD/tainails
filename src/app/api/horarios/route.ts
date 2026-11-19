import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { STATUS_HORARIO } from '@/lib/constants'
import { hojeStr, addDias } from '@/lib/format'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const hoje = hojeStr()
  const limite = addDias(hoje, 30)

  const where = user.tipo === 'manicure'
    ? { manicureId: user.id, data: { gte: hoje, lte: limite } }
    : { data: { gte: hoje, lte: limite }, status: STATUS_HORARIO.livre }

  const horarios = await db.horarioDisponivel.findMany({
    where,
    orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
  })

  return NextResponse.json({ horarios })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.tipo !== 'manicure') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: { horarios?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  if (!Array.isArray(body.horarios) || body.horarios.length === 0) {
    return NextResponse.json({ error: 'Lista de horários vazia' }, { status: 400 })
  }
  if (body.horarios.length > 200) {
    return NextResponse.json({ error: 'Máximo de 200 horários por lote' }, { status: 400 })
  }

  const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/
  const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/
  for (const h of body.horarios) {
    const item = h as { data?: unknown; horaInicio?: unknown; horaFim?: unknown }
    if (
      typeof item.data !== 'string' || !REGEX_DATA.test(item.data) ||
      typeof item.horaInicio !== 'string' || !REGEX_HORA.test(item.horaInicio) ||
      typeof item.horaFim !== 'string' || !REGEX_HORA.test(item.horaFim) ||
      item.horaFim <= item.horaInicio
    ) {
      return NextResponse.json({ error: 'Horário inválido (formato AAAA-MM-DD e HH:MM, fim > início)' }, { status: 400 })
    }
  }

  try {
    // Upserts sequenciais para evitar corrida no unique composto (P2002)
    let criados = 0
    for (const h of body.horarios as { data: string; horaInicio: string; horaFim: string }[]) {
      const r = await db.horarioDisponivel.upsert({
        where: { manicureId_data_horaInicio: { manicureId: user.id, data: h.data, horaInicio: h.horaInicio } },
        update: {},
        create: { manicureId: user.id, ...h },
      })
      if (r) criados++
    }

    return NextResponse.json({ criados })
  } catch (e) {
    console.error('Erro ao criar horários:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
