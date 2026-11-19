import { db } from '@/lib/db'
import { TIPO_NOTIFICACAO, type TipoNotificacao } from '@/lib/constants'

interface NotifParams {
  usuarioId: string
  agendamentoId?: string
  tipo: TipoNotificacao
  mensagem: string
}

export async function criarNotificacao({ usuarioId, agendamentoId, tipo, mensagem }: NotifParams) {
  const notif = await db.notificacao.create({
    data: {
      usuarioId,
      agendamentoId: agendamentoId ?? null,
      tipo,
      mensagem,
    },
  })
  return notif
}

export function msgSinalAprovado(nomeCliente: string, dataHora: string) {
  return `Olá ${nomeCliente}! Seu comprovante de sinal foi aprovado. Agendamento confirmado para ${dataHora}. Até lá! 💅`
}
export function msgSinalRejeitado(nomeCliente: string, motivo?: string) {
  return `Olá ${nomeCliente}, seu comprovante de sinal foi rejeitado${motivo ? `: ${motivo}` : ''}. Por favor, envie um novo comprovante ou entre em contato.`
}
export function msgSinalExpirado(nomeCliente: string, dataHora: string) {
  return `Olá ${nomeCliente}, seu agendamento para ${dataHora} expirou por falta de comprovante do sinal. Queira reagendar quando desejar.`
}
export function msgConfirmado(nomeCliente: string, dataHora: string) {
  return `Olá ${nomeCliente}! Seu agendamento foi confirmado para ${dataHora}. Até lá! 💅`
}
export function msgRecusado(nomeCliente: string, motivo?: string) {
  return `Olá ${nomeCliente}, infelizmente não foi possível confirmar seu agendamento${motivo ? `: ${motivo}` : ''}. Entre em contato para reagendar.`
}
export function msgCancelado(nomeCliente: string, dataHora: string) {
  return `Olá ${nomeCliente}, seu agendamento de ${dataHora} foi cancelado.`
}
export function msgLembrete(nomeCliente: string, dataHora: string) {
  return `Olá ${nomeCliente}! Lembrando do seu atendimento amanhã às ${dataHora}.`
}
