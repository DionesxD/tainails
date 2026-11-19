'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AvatarBubble } from '@/components/avatar-bubble'
import { Check, X, FileText, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatDataCurta } from '@/lib/format'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

interface Agendamento {
  id: string
  status: string
  servico: { id: string; nome: string; preco: number }
  horario: { id: string; data: string; horaInicio: string }
  cliente: { id: string; nome: string; eClienteConfianca: boolean }
  valorSinal: number | null
  comprovante: { urlComprovante: string; status: string } | null
}

export function AdminPending() {
  const qc = useQueryClient()
  const [rejeitarAg, setRejeitarAg] = useState<Agendamento | null>(null)
  const [motivo, setMotivo] = useState('')

  const { data: agendamentos, isLoading } = useQuery<Agendamento[]>({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const res = await fetch('/api/agendamentos', { credentials: 'include' })
      const j = await res.json()
      return j.agendamentos ?? []
    },
  })

  const pendentes = agendamentos?.filter(
    (a) => a.status === 'aguardando_sinal' && (!a.comprovante || a.comprovante.status === 'pendente')
  ) || []

  const aprovarComprovante = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agendamentos/${id}/comprovante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'aprovar' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
      toast.success('Comprovante aprovado! Cliente notificada.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const rejeitarComprovante = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agendamentos/${rejeitarAg!.id}/comprovante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'rejeitar', motivo }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
      toast.success('Comprovante rejeitado. Cliente notificada.')
      setRejeitarAg(null); setMotivo('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-serif font-bold">Comprovantes de sinal</h1>
        <p className="text-sm text-muted-foreground">{pendentes.length} aguardando aprovação</p>
      </div>

      {isLoading ? (
        <div className="h-40 w-full rounded-2xl shimmer" />
      ) : pendentes.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-8 text-center">
            <Check className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum comprovante pendente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendentes.map((a) => (
            <Card key={a.id} className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <AvatarBubble nome={a.cliente.nome} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-semibold truncate">{a.cliente.nome}</p>
                    <p className="text-sm text-primary">{formatDataCurta(a.horario.data)} às {a.horario.horaInicio}</p>
                    <p className="text-xs text-muted-foreground">{a.servico.nome}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Sinal</p>
                    <p className="font-bold text-primary tabular-nums">R$ {(a.valorSinal || 0).toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>

                {/* Preview do comprovante */}
                {a.comprovante ? (
                  <div className="rounded-xl overflow-hidden border border-border">
                    <img src={a.comprovante.urlComprovante} alt="Comprovante" className="w-full max-h-48 object-cover" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Cliente ainda não enviou o comprovante</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" /> Aguardando envio
                    </p>
                  </div>
                )}

                {a.comprovante && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => aprovarComprovante.mutate(a.id)}
                      disabled={aprovarComprovante.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setRejeitarAg(a)}
                    >
                      <X className="h-4 w-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog rejeitar */}
      <Dialog open={!!rejeitarAg} onOpenChange={(o) => !o && setRejeitarAg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar comprovante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da rejeição</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: comprovante ilegível, valor incorreto..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejeitarAg(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => rejeitarComprovante.mutate()}
              disabled={rejeitarComprovante.isPending || !motivo}
            >
              {rejeitarComprovante.isPending ? 'Enviando...' : 'Rejeitar comprovante'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
