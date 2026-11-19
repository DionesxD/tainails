'use client'

import { useNotificacoesNaoLidas } from '@/hooks/use-notificacoes-nao-lidas'
import {
  Bell, X, CheckCheck, Calendar, CalendarCheck, CalendarX, Sparkles,
  AlertTriangle, Info, Trash2, Mail, MailOpen, Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { hapticTap, hapticSuccess } from '@/lib/feedback'

interface Notificacao {
  id: string
  tipo: string
  mensagem: string
  lida: boolean
  enviadaEm: string
  agendamentoId?: string | null
}

function tempoRelativo(iso: string): string {
  const data = new Date(iso)
  const agora = new Date()
  const diffMs = agora.getTime() - data.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHora = Math.floor(diffMin / 60)
  const diffDia = Math.floor(diffHora / 24)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  if (diffHora < 24) return `há ${diffHora}h`
  if (diffDia === 1) return 'ontem'
  if (diffDia < 7) return `há ${diffDia} dias`
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function iconePorTipo(tipo: string) {
  switch (tipo) {
    case 'agendamento_confirmado':
      return { Icon: CalendarCheck, cor: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    case 'agendamento_recusado':
    case 'agendamento_cancelado':
      return { Icon: CalendarX, cor: 'text-rose-500', bg: 'bg-rose-500/10' }
    case 'lembrete_atendimento':
      return { Icon: Calendar, cor: 'text-blue-500', bg: 'bg-blue-500/10' }
    case 'sinal_aprovado':
      return { Icon: CheckCheck, cor: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    case 'sinal_rejeitado':
    case 'sinal_expirado':
      return { Icon: AlertTriangle, cor: 'text-amber-500', bg: 'bg-amber-500/10' }
    default:
      return { Icon: Info, cor: 'text-primary', bg: 'bg-primary/10' }
  }
}

function labelTipo(tipo: string): string {
  const map: Record<string, string> = {
    agendamento_confirmado: 'Confirmados',
    agendamento_recusado: 'Recusados',
    agendamento_cancelado: 'Cancelados',
    lembrete_atendimento: 'Lembretes',
    sinal_aprovado: 'Sinais aprovados',
    sinal_rejeitado: 'Sinais rejeitados',
    sinal_expirado: 'Sinais expirados',
  }
  return map[tipo] || 'Outros'
}

function tocarSomNotificacao() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1318, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

type Filtro = 'todas' | 'naolidas' | string

function getFiltrosDisponiveis(notifs: Notificacao[]) {
  const tipos = Array.from(new Set(notifs.map((n) => n.tipo)))
  return [
    { id: 'todas', label: 'Todas' },
    { id: 'naolidas', label: 'Não lidas' },
    ...tipos.map((t) => ({ id: t, label: labelTipo(t) })),
  ]
}

export function NotificationBell() {
  const naoLidas = useNotificacoesNaoLidas()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [menuAcoesId, setMenuAcoesId] = useState<string | null>(null)
  const prevCountRef = useRef<number>(0)

  const { data: notifs } = useQuery<Notificacao[]>({
    queryKey: ['notificacoes'],
    queryFn: async () => {
      const res = await fetch('/api/notificacoes', { credentials: 'include' })
      const j = await res.json()
      return j.notificacoes ?? []
    },
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (!notifs) return
    const naoLidasAtual = notifs.filter((n) => !n.lida).length
    if (prevCountRef.current > 0 && naoLidasAtual > prevCountRef.current) {
      let prefs = { som: true, vibrar: true }
      try {
        const raw = localStorage.getItem('tainails:notif-prefs')
        if (raw) prefs = { ...prefs, ...JSON.parse(raw) }
      } catch {}
      if (prefs.som) tocarSomNotificacao()
      if (prefs.vibrar) hapticSuccess()
    }
    prevCountRef.current = naoLidasAtual
  }, [notifs])

  useEffect(() => {
    if (!open) return
    const temNaoLidas = notifs && notifs.some((n) => !n.lida)
    if (!temNaoLidas) return
    const t = setTimeout(() => {
      fetch('/api/notificacoes', { method: 'PATCH' }).then(() => {
        qc.invalidateQueries({ queryKey: ['notificacoes'] })
      })
    }, 1500)
    return () => clearTimeout(t)
  }, [open, notifs, qc])

  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open])

  async function marcarTodasLidas() {
    hapticTap()
    await fetch('/api/notificacoes', { method: 'PATCH' })
    qc.invalidateQueries({ queryKey: ['notificacoes'] })
  }

  async function limparTudo() {
    hapticTap()
    await fetch('/api/notificacoes', { method: 'DELETE' })
    qc.invalidateQueries({ queryKey: ['notificacoes'] })
  }

  async function deletarUma(id: string) {
    hapticTap()
    await fetch('/api/notificacoes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    qc.invalidateQueries({ queryKey: ['notificacoes'] })
  }

  async function toggleLida(n: Notificacao) {
    hapticTap()
    await fetch('/api/notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: n.id, lida: !n.lida }),
    })
    qc.invalidateQueries({ queryKey: ['notificacoes'] })
  }

  const notifsFiltradas = (notifs ?? []).filter((n) => {
    if (filtro === 'todas') return true
    if (filtro === 'naolidas') return !n.lida
    return n.tipo === filtro
  })

  const filtrosDisponiveis = notifs ? getFiltrosDisponiveis(notifs) : []

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-muted/50 transition-colors press"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {naoLidas > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center pulse-ring"
          >
            {naoLidas > 9 ? '9+' : naoLidas}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-2 top-14 z-50 w-[calc(100vw-1rem)] max-w-sm max-h-[80vh] flex flex-col rounded-2xl shadow-xl glass-strong overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Notificações</h3>
                  {naoLidas > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {naoLidas}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {notifs && notifs.some((n) => !n.lida) && (
                    <button
                      onClick={marcarTodasLidas}
                      className="text-[11px] text-primary hover:underline px-2 py-1 rounded-full press"
                      title="Marcar todas como lidas"
                    >
                      Marcar lidas
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded-full hover:bg-muted/50 press"
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {filtrosDisponiveis.length > 2 && (
                <div className="flex gap-1 overflow-x-auto scrollbar-thin px-3 py-2 border-b border-border">
                  {filtrosDisponiveis.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFiltro(f.id)}
                      className={cn(
                        'shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all press',
                        filtro === f.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {notifsFiltradas.length > 0 ? (
                  <div className="divide-y divide-border">
                    {notifsFiltradas.slice(0, 30).map((n, idx) => {
                      const { Icon, cor, bg } = iconePorTipo(n.tipo)
                      const menuOpen = menuAcoesId === n.id
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                          className={cn(
                            'relative group flex gap-3 p-3 hover:bg-muted/30 transition-colors',
                            !n.lida && 'bg-primary/5'
                          )}
                        >
                          <div className={cn('shrink-0 h-9 w-9 rounded-full grid place-items-center', bg)}>
                            <Icon className={cn('h-4 w-4', cor)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-snug">{n.mensagem}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              {tempoRelativo(n.enviadaEm)}
                            </p>
                          </div>
                          {!n.lida && (
                            <div className="shrink-0 self-start mt-1.5 h-2 w-2 rounded-full bg-primary" />
                          )}
                          <button
                            onClick={() => { hapticTap(); setMenuAcoesId(menuOpen ? null : n.id) }}
                            className="shrink-0 self-start mt-0.5 p-1 rounded-full hover:bg-muted/70 opacity-0 group-hover:opacity-100 transition-opacity press"
                            aria-label="Mais ações"
                          >
                            <Filter className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
                          </button>
                          <AnimatePresence>
                            {menuOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute right-2 top-10 z-10 rounded-xl glass-strong shadow-lg overflow-hidden min-w-[140px]"
                              >
                                <button
                                  onClick={() => { toggleLida(n); setMenuAcoesId(null) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 text-left"
                                >
                                  {n.lida ? (<><Mail className="h-3.5 w-3.5" /> Marcar não lida</>) : (<><MailOpen className="h-3.5 w-3.5" /> Marcar lida</>)}
                                </button>
                                <button
                                  onClick={() => { deletarUma(n.id); setMenuAcoesId(null) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-rose-500/10 text-rose-600 text-left"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="h-14 w-14 mx-auto rounded-full bg-muted/50 grid place-items-center mb-3">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {filtro === 'naolidas' ? 'Tudo lido!' : 'Sem notificações'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {filtro === 'naolidas' ? 'Você não tem notificações pendentes.' : 'Quando algo acontecer, aparecerá aqui.'}
                    </p>
                  </div>
                )}
              </div>

              {notifs && notifs.length > 0 && (
                <div className="border-t border-border px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{notifs.length} notificação{notifs.length !== 1 ? 'ões' : ''}</span>
                  <button onClick={limparTudo} className="text-primary hover:underline flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> Limpar tudo
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
