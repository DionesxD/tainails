'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Plus, Trash2, Clock, Ban, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Horario {
  id: string
  data: string
  horaInicio: string
  horaFim: string
  status: string
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function pad(n: number) { return n.toString().padStart(2, '0') }
function hojeDate(): Date { return new Date() }
function toISODate(d: Date): string { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function fromISODate(s: string): Date { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function isSameDay(a: Date, b: Date): boolean { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }

export function AdminSchedule() {
  const qc = useQueryClient()
  const [mesAtual, setMesAtual] = useState(() => {
    const h = hojeDate()
    return new Date(h.getFullYear(), h.getMonth(), 1)
  })
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)

  const { data: horarios, isLoading } = useQuery<Horario[]>({
    queryKey: ['horarios-admin', toISODate(mesAtual)],
    queryFn: async () => {
      const res = await fetch('/api/horarios', { credentials: 'include' })
      const j = await res.json()
      return j.horarios ?? []
    },
  })

  const horariosPorDia: Record<string, Horario[]> = {}
  for (const h of horarios ?? []) {
    if (!horariosPorDia[h.data]) horariosPorDia[h.data] = []
    horariosPorDia[h.data].push(h)
  }

  const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1)
  const inicioGrid = addDays(primeiroDia, -primeiroDia.getDay())
  const diasGrid: Date[] = Array.from({ length: 42 }).map((_, i) => addDays(inicioGrid, i))

  const hoje = hojeDate()
  const hojeISO = toISODate(hoje)

  const adicionarHorario = useMutation({
    mutationFn: async (horarios: { data: string; horaInicio: string; horaFim: string }[]) => {
      const res = await fetch('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horarios }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['horarios-admin'] })
      toast.success('Horário adicionado!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const removerHorario = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/horarios/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['horarios-admin'] })
      toast.success('Horário removido!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const bloquearDia = useMutation({
    mutationFn: async ({ horarios }: { data: string; horarios: Horario[] }) => {
      const resultados = await Promise.all(
        horarios.filter((h) => h.status === 'livre').map((h) =>
          fetch(`/api/horarios/${h.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'bloqueado' }),
          })
        )
      )
      const falha = resultados.find((r) => !r.ok)
      if (falha) {
        const d = await falha.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(d.error || 'Erro ao bloquear dia')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['horarios-admin'] })
      toast.success('Dia bloqueado — indisponível para agendamentos!')
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao bloquear dia'),
  })

  const desbloquearDia = useMutation({
    mutationFn: async ({ horarios }: { horarios: Horario[] }) => {
      const resultados = await Promise.all(
        horarios.filter((h) => h.status === 'bloqueado').map((h) =>
          fetch(`/api/horarios/${h.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'livre' }),
          })
        )
      )
      const falha = resultados.find((r) => !r.ok)
      if (falha) {
        const d = await falha.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(d.error || 'Erro ao liberar dia')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['horarios-admin'] })
      toast.success('Dia liberado!')
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao liberar dia'),
  })

  const diaInfo = diaSelecionado ? horariosPorDia[diaSelecionado] ?? [] : []

  function statusHorarioCor(status: string) {
    switch (status) {
      case 'livre': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
      case 'reservado': return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
      case 'bloqueado': return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-serif font-bold">Minha agenda</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus horários disponíveis e bloqueios</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-serif font-semibold">
              {MESES[mesAtual.getMonth()]} {mesAtual.getFullYear()}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
            {DIAS_SEMANA.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>

          {!isLoading && (
            <div className="grid grid-cols-7 gap-1">
              {diasGrid.map((dia) => {
                const iso = toISODate(dia)
                const noMes = dia.getMonth() === mesAtual.getMonth()
                const ehHoje = isSameDay(dia, hoje)
                const ehPassado = dia < hoje && !ehHoje
                const horariosDia = horariosPorDia[iso] ?? []
                const temLivre = horariosDia.some((h) => h.status === 'livre')
                const temReservado = horariosDia.some((h) => h.status === 'reservado')
                const temBloqueado = horariosDia.some((h) => h.status === 'bloqueado')
                const todosBloqueados = horariosDia.length > 0 && horariosDia.every((h) => h.status === 'bloqueado')

                return (
                  <button
                    key={iso}
                    onClick={() => !ehPassado && setDiaSelecionado(iso)}
                    disabled={ehPassado}
                    className={cn(
                      'aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition-all',
                      noMes ? 'bg-card text-foreground' : 'bg-muted/30 text-muted-foreground',
                      ehHoje && 'ring-2 ring-primary',
                      !ehPassado && 'hover:bg-primary/10 hover:scale-105 cursor-pointer',
                      ehPassado && 'opacity-40 cursor-not-allowed',
                      diaSelecionado === iso && 'bg-primary text-primary-foreground',
                      todosBloqueados && !ehPassado && 'bg-rose-500/10'
                    )}
                    title={`${horariosDia.length} horário(s)`}
                  >
                    <span className="font-medium">{dia.getDate()}</span>
                    {horariosDia.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {temLivre && <span className={cn('h-1 w-1 rounded-full', diaSelecionado === iso ? 'bg-primary-foreground' : 'bg-emerald-500')} />}
                        {temReservado && <span className={cn('h-1 w-1 rounded-full', diaSelecionado === iso ? 'bg-primary-foreground' : 'bg-blue-500')} />}
                        {temBloqueado && <span className={cn('h-1 w-1 rounded-full', diaSelecionado === iso ? 'bg-primary-foreground' : 'bg-rose-500')} />}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => <div key={i} className="aspect-square rounded-lg shimmer" />)}
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-2 border-t border-border">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Livre</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Reservado</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Bloqueado</span>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {diaSelecionado && (
          <DiaModal
            data={diaSelecionado}
            horarios={diaInfo}
            onClose={() => setDiaSelecionado(null)}
            onAdicionar={(h) => adicionarHorario.mutate([h])}
            onRemover={(id) => removerHorario.mutate(id)}
            onBloquear={() => bloquearDia.mutate({ data: diaSelecionado, horarios: diaInfo })}
            onDesbloquear={() => desbloquearDia.mutate({ horarios: diaInfo })}
            statusCor={statusHorarioCor}
          />
        )}
      </AnimatePresence>

      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-serif font-semibold text-sm">Atalhos rápidos</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const horarios = [
                { data: hojeISO, horaInicio: '09:00', horaFim: '10:30' },
                { data: hojeISO, horaInicio: '10:30', horaFim: '12:00' },
                { data: hojeISO, horaInicio: '14:00', horaFim: '15:30' },
                { data: hojeISO, horaInicio: '15:30', horaFim: '17:00' },
              ]
              adicionarHorario.mutate(horarios)
            }}>
              <Plus className="h-4 w-4 mr-1.5" /> Hoje padrão
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const horarios: { data: string; horaInicio: string; horaFim: string }[] = []
              for (let i = 0; i < 7; i++) {
                const d = addDays(hoje, i)
                const data = toISODate(d)
                horarios.push({ data, horaInicio: '09:00', horaFim: '10:30' })
                horarios.push({ data, horaInicio: '10:30', horaFim: '12:00' })
                horarios.push({ data, horaInicio: '14:00', horaFim: '15:30' })
                horarios.push({ data, horaInicio: '15:30', horaFim: '17:00' })
              }
              adicionarHorario.mutate(horarios)
            }}>
              <Plus className="h-4 w-4 mr-1.5" /> 7 dias
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            "Hoje padrão" cria 4 slots (9h, 10:30h, 14h, 15:30h). "7 dias" replica para a próxima semana.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function DiaModal({
  data, horarios, onClose, onAdicionar, onRemover, onBloquear, onDesbloquear, statusCor,
}: {
  data: string
  horarios: Horario[]
  onClose: () => void
  onAdicionar: (h: { data: string; horaInicio: string; horaFim: string }) => void
  onRemover: (id: string) => void
  onBloquear: () => void
  onDesbloquear: () => void
  statusCor: (s: string) => string
}) {
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFim, setHoraFim] = useState('10:30')
  const d = fromISODate(data)
  const dataFormatada = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const temBloqueados = horarios.some((h) => h.status === 'bloqueado')

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] max-w-md max-h-[85vh] overflow-y-auto scrollbar-thin bg-card border border-border rounded-2xl shadow-xl"
      >
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-semibold capitalize">{dataFormatada}</h3>
            <p className="text-[11px] text-muted-foreground">{horarios.length} horário(s) cadastrado(s)</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted/50 press">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            {temBloqueados ? (
              <Button variant="outline" size="sm" className="flex-1" onClick={onDesbloquear}>
                <Ban className="h-4 w-4 mr-1.5" /> Liberar dia
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="flex-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={onBloquear}>
                <Ban className="h-4 w-4 mr-1.5" /> Bloquear dia
              </Button>
            )}
          </div>

          <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Adicionar horário
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="hi" className="text-xs">Início</Label>
                <Input id="hi" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hf" className="text-xs">Fim</Label>
                <Input id="hf" type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} className="text-sm" />
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={() => onAdicionar({ data, horaInicio, horaFim })} disabled={!horaInicio || !horaFim || horaInicio >= horaFim}>
              <Plus className="h-4 w-4 mr-1.5" /> Adicionar
            </Button>
          </div>

          {horarios.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Horários do dia
              </p>
              <div className="space-y-1.5">
                {horarios.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)).map((h) => (
                  <div key={h.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{h.horaInicio} — {h.horaFim}</p>
                      <span className={cn('inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border', statusCor(h.status))}>
                        {h.status === 'livre' && 'Livre'}
                        {h.status === 'reservado' && 'Reservado'}
                        {h.status === 'bloqueado' && 'Bloqueado'}
                      </span>
                    </div>
                    {h.status === 'livre' && (
                      <button onClick={() => onRemover(h.id)} className="p-1.5 rounded-full hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 press" title="Remover horário">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhum horário neste dia.<br />Use o formulário acima para adicionar.
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
