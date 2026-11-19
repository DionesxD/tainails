import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { STATUS_AGENDAMENTO } from '@/lib/constants'
import { criarNotificacao, msgLembrete } from '@/lib/notifications'
import { hojeStr, addDias } from '@/lib/format'
import { validateCronSecret } from '@/lib/cron-auth'

export async function POST(req: NextRequest) {
  const authError = validateCronSecret(req)
  if (authError) return authError

  const amanha = addDias(hojeStr(), 1)

  const agendamentos = await db.agendamento.findMany({
    where: {
      status: STATUS_AGENDAMENTO.confirmado,
      horario: { data: amanha },
    },
    include: { cliente: true, horario: true, servico: true },
  })

  for (const ag of agendamentos) {
    const dataHora = `${ag.horario.data.split('-').reverse().join('/')} às ${ag.horario.horaInicio}`
    await criarNotificacao({
      usuarioId: ag.clienteId,
      agendamentoId: ag.id,
      tipo: 'lembrete_atendimento',
      mensagem: msgLembrete(ag.cliente.nome, dataHora),
    })
  }

  return NextResponse.json({ lembretes: agendamentos.length })
}

export async function GET(req: NextRequest) {
  return POST(req)
}
