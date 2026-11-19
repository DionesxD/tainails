'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { SinalBanner } from '@/components/sinal-banner'
import { CalendarDays, Palette, ChevronRight, Sparkles, Clock, AlertCircle } from 'lucide-react'
import { formatDataCurta, esmalteStyle } from '@/lib/format'
import { useAuthStore } from '@/components/auth-provider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { StatusAgendamento } from '@/lib/constants'
import { ImageTrack } from '@/components/image-track'

interface Agendamento {
  id: string
  status: StatusAgendamento
  servico: { id: string; nome: string; preco: number; duracaoMinutos: number }
  corEsmalte: { id: string; nome: string; hex: string } | null
  horario: { id: string; data: string; horaInicio: string; horaFim: string }
  observacoesCliente: string | null
  valorSinal: number | null
  sinalExpiraEm: string | null
}
interface Modelo {
  id: string
  urlImagem: string
  descricao: string | null
  tags: string[]
}

export function ClientHome({ onAgendar, onProvador }: { onAgendar: () => void; onProvador: () => void }) {
  const user = useAuthStore((s) => s.user)
  const [modeloAberto, setModeloAberto] = useState<Modelo | null>(null)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 200], [0, -30])
  const heroOpacity = useTransform(scrollY, [0, 150], [1, 0.7])

  const { data: agData, isLoading: agLoading } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const res = await fetch('/api/agendamentos', { credentials: 'include' })
      const j = await res.json()
      return (j.agendamentos ?? []) as Agendamento[]
    },
  })
  const { data: galeria } = useQuery({
    queryKey: ['galeria'],
    queryFn: async () => {
      const res = await fetch('/api/galeria', { credentials: 'include' })
      const j = await res.json()
      return (j.modelos ?? []) as Modelo[]
    },
  })
  const { data: config } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const res = await fetch('/api/configuracoes', { credentials: 'include' })
      const j = await res.json()
      return j.configuracoes as { chavePix: string | null } | undefined
    },
  })

  const hoje = new Date().toISOString().slice(0, 10)
  const proximo = agData
    ?.filter((a) => ['aguardando_sinal', 'confirmado'].includes(a.status))
    .filter((a) => a.horario.data >= hoje)
    .sort((a, b) => (a.horario.data + a.horario.horaInicio).localeCompare(b.horario.data + b.horario.horaInicio))[0]

  return (
    <div className="p-4 space-y-6">
      <motion.div style={{ y: heroY, opacity: heroOpacity }}>
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="text-2xl font-serif font-bold tracking-tight">{user?.nome.split(' ')[0]} 👋</h1>
      </motion.div>

      <Button size="lg" className="w-full h-14 text-base font-semibold gap-2" onClick={onAgendar}>
        <CalendarDays className="h-5 w-5" />
        Agendar horário
      </Button>

      {/* Próximo agendamento */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> Próximo agendamento
        </h2>
        {agLoading ? (
          <div className="h-28 w-full rounded-2xl shimmer" />
        ) : proximo ? (
          <Card className="glass glass-highlight border-border overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-serif font-bold text-lg leading-tight">
                    {formatDataCurta(proximo.horario.data)}
                  </p>
                  <p className="text-primary font-medium">{proximo.horario.horaInicio}</p>
                  <p className="text-sm text-muted-foreground mt-1">{proximo.servico.nome}</p>
                </div>
                <StatusBadge status={proximo.status} />
              </div>
              {proximo.corEsmalte && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <span className="h-5 w-5 rounded-full border border-border" style={esmalteStyle(proximo.corEsmalte.hex)} />
                  <span className="text-sm text-muted-foreground">{proximo.corEsmalte.nome}</span>
                </div>
              )}
              {/* Banner de sinal */}
              {proximo.status === 'aguardando_sinal' && proximo.valorSinal && (
                <SinalBanner
                  valorSinal={proximo.valorSinal}
                  expiraEm={proximo.sinalExpiraEm}
                  agendamentoId={proximo.id}
                  chavePix={config?.chavePix}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/50 border-dashed border-border">
            <CardContent className="p-6 text-center">
              <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum agendamento ativo.</p>
              <Button variant="link" className="mt-1 p-0 h-auto" onClick={onAgendar}>
                Que tal marcar agora? →
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Provador de cores */}
      <Card className="glass glass-highlight border-primary/30 bg-gradient-to-br from-primary/15 to-transparent">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif font-semibold">Provador de cores</p>
            <p className="text-xs text-muted-foreground">Experimente esmaltes antes de agendar</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onProvador} className="text-primary">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      {/* Galeria */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> Galeria de modelos
          </h2>
        </div>
        {galeria && galeria.length > 0 ? (
          <ImageTrack
            className="-mx-4"
            height={280}
            images={galeria.map((m) => ({ id: m.id, url: m.urlImagem, alt: m.descricao }))}
            onImageClick={(i) => setModeloAberto(galeria[i])}
          />
        ) : (
          <div className="h-40 w-full rounded-2xl shimmer" />
        )}
      </section>

      <Dialog open={!!modeloAberto} onOpenChange={(o) => !o && setModeloAberto(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modeloAberto?.descricao || 'Modelo de unhas'}</DialogTitle>
          </DialogHeader>
          {modeloAberto && (
            <div>
              <img src={modeloAberto.urlImagem} alt={modeloAberto.descricao || 'Modelo'} className="w-full rounded-xl object-cover" />
              {modeloAberto.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {modeloAberto.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
