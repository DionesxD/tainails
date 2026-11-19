// Constantes e tipos compartilhados — Tainails

export const STATUS_AGENDAMENTO = {
  aguardando_sinal: 'aguardando_sinal',
  confirmado: 'confirmado',
  recusado: 'recusado',
  concluido: 'concluido',
  cancelado: 'cancelado',
  expirado: 'expirado',
} as const
export type StatusAgendamento = keyof typeof STATUS_AGENDAMENTO

export const STATUS_HORARIO = {
  livre: 'livre',
  reservado: 'reservado',
  bloqueado: 'bloqueado',
} as const
export type StatusHorario = keyof typeof STATUS_HORARIO

export const TIPO_USUARIO = {
  cliente: 'cliente',
  manicure: 'manicure',
} as const
export type TipoUsuario = keyof typeof TIPO_USUARIO

export const FORMA_PAGAMENTO = {
  pix: 'pix',
  dinheiro: 'dinheiro',
  cartao_debito: 'cartao_debito',
  cartao_credito: 'cartao_credito',
  outro: 'outro',
} as const
export type FormaPagamento = keyof typeof FORMA_PAGAMENTO

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao_debito: 'Cartão de débito',
  cartao_credito: 'Cartão de crédito',
  outro: 'Outro',
}

export const TIPO_NOTIFICACAO = {
  agendamento_confirmado: 'agendamento_confirmado',
  agendamento_recusado: 'agendamento_recusado',
  lembrete_atendimento: 'lembrete_atendimento',
  horario_vago: 'horario_vago',
  agendamento_cancelado: 'agendamento_cancelado',
  sinal_aprovado: 'sinal_aprovado',
  sinal_rejeitado: 'sinal_rejeitado',
  sinal_expirado: 'sinal_expirado',
} as const
export type TipoNotificacao = keyof typeof TIPO_NOTIFICACAO

export const STATUS_AGENDAMENTO_LABELS: Record<StatusAgendamento, string> = {
  aguardando_sinal: 'Aguardando sinal',
  confirmado: 'Confirmado',
  recusado: 'Recusado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  expirado: 'Expirado',
}

// Cores de status — legíveis nos dois temas (Rosé Cashmere e Velvet Plum dark)
export const STATUS_AGENDAMENTO_CORES: Record<StatusAgendamento, string> = {
  aguardando_sinal:
    'bg-amber-100/50 text-amber-900 border-amber-300/60 dark:bg-amber-400/10 dark:text-amber-200 dark:border-amber-400/30',
  confirmado:
    'bg-emerald-100/50 text-emerald-900 border-emerald-300/60 dark:bg-emerald-400/10 dark:text-emerald-200 dark:border-emerald-400/30',
  recusado:
    'bg-red-100/50 text-red-900 border-red-300/60 dark:bg-red-400/10 dark:text-red-200 dark:border-red-400/30',
  concluido:
    'bg-pink-100/50 text-pink-900 border-pink-300/60 dark:bg-pink-400/10 dark:text-pink-200 dark:border-pink-400/30',
  cancelado:
    'bg-neutral-200/50 text-neutral-700 border-neutral-300/60 dark:bg-neutral-500/10 dark:text-neutral-300 dark:border-neutral-500/30',
  expirado:
    'bg-neutral-200/50 text-neutral-600 border-neutral-300/60 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/30',
}

export const CANCELAMENTO_HORAS_MIN = 4
export const REPOSICAO_UNHA_VALOR = 10

// Paleta oficial Tainails (Rosé Cashmere / Velvet Plum)
export const TAINAILS_COLORS = {
  dustyRose: '#F7A6B7',
  roseProfundo: '#C94D68',
  roseCashmere: '#F6E9EB',
  champagne: '#E8D3C0',
  velvetPlum: '#23151D',
  plumCard: '#2F1D27',
} as const
