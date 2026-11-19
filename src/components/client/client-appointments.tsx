'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { SinalBanner } from '@/components/sinal-banner'
import { CalendarDays, Clock } from 'lucide-react'
import { formatDataCurta, esmalteStyle } from '@/lib/format'
import type { StatusAgendamento } from '@/lib/constants'

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

export function ClientAppointments({ onAgendar }: { onAgendar: () => void }) {
  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const res = await fetch('/api/agendamentos', { credentials: 'include' })
      const j = await res.json()
      return (j.agendamentos ?? []) as Agendamento[]
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

  const ordenados = agendamentos
    ?.slice()
    .sort((a, b) => (b.horario.data + b.horario.horaInicio).localeCompare(a.horario.data + a.horario.horaInicio))

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-serif font-bold">Meus agendamentos</h1>

      {isLoading ? (
        <div className="h-28 w-full rounded-2xl shimmer" />
      ) : !ordenados || ordenados.length === 0 ? (
        <Card className="bg-card/50 border-dashed border-border">
          <CardContent className="p-8 text-center">
            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Você ainda não tem agendamentos.</p>
            <Button variant="link" className="p-0 h-auto" onClick={onAgendar}>Agendar agora →</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ordenados.map((a) => (
            <Card key={a.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif font-bold text-lg leading-tight">
                      {formatDataCurta(a.horario.data)}
                    </p>
                    <p className="text-primary font-medium flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {a.horario.horaInicio}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{a.servico.nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      R$ {a.servico.preco.toFixed(2).replace('.', ',')}
                    </p>
                    {a.corEsmalte && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="h-4 w-4 rounded-full border border-border" style={esmalteStyle(a.corEsmalte.hex)} />
                        <span className="text-xs text-muted-foreground">{a.corEsmalte.nome}</span>
                      </div>
                    )}
                    {a.observacoesCliente && (
                      <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">"{a.observacoesCliente}"</p>
                    )}
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                {/* Sinal banner para aguardando_sinal */}
                {a.status === 'aguardando_sinal' && a.valorSinal && (
                  <SinalBanner
                    valorSinal={a.valorSinal}
                    expiraEm={a.sinalExpiraEm}
                    agendamentoId={a.id}
                    chavePix={config?.chavePix}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
