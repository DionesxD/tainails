import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { STATUS_AGENDAMENTO, STATUS_HORARIO } from '@/lib/constants'
import { criarNotificacao, msgSinalExpirado } from '@/lib/notifications'
import { validateCronSecret } from '@/lib/cron-auth'

export async function POST(req: NextRequest) {
  const authError = validateCronSecret(req)
  if (authError) return authError

  try {
    const agora = new Date().toISOString()

    const expirados = await db.agendamento.findMany({
      where: {
        status: STATUS_AGENDAMENTO.aguardando_sinal,
        sinalExpiraEm: { lt: agora },
      },
      include: { cliente: true, horario: true },
    })

    let total = 0
    for (const ag of expirados) {
      // Atualização condicional: só expira se AINDA estiver aguardando sinal
      // (evita sobrescrever agendamento aprovado no intervalo — TOCTOU)
      const r = await db.agendamento.updateMany({
        where: { id: ag.id, status: STATUS_AGENDAMENTO.aguardando_sinal },
        data: { status: STATUS_AGENDAMENTO.expirado },
      })
      if (r.count === 0) continue
      total++

      await db.horarioDisponivel.update({
        where: { id: ag.horarioId },
        data: { status: STATUS_HORARIO.livre },
      })

      const dataHora = `${ag.horario.data.split('-').reverse().join('/')} às ${ag.horario.horaInicio}`
      await criarNotificacao({
        usuarioId: ag.clienteId,
        agendamentoId: ag.id,
        tipo: 'sinal_expirado',
        mensagem: msgSinalExpirado(ag.cliente.nome, dataHora),
      })
    }

    return NextResponse.json({ expirados: total })
  } catch (e) {
    console.error('Erro ao expirar sinais:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
