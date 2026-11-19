'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/status-badge'
import { AvatarBubble } from '@/components/avatar-bubble'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarClock, Check, X, CheckCircle2, Star, Clock, Plus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { hapticSuccess, confetti } from '@/lib/feedback'
import { hojeStr, addDias, parseData, formatDataCurta, esmalteStyle } from '@/lib/format'
import { FORMA_PAGAMENTO, FORMA_PAGAMENTO_LABELS, type FormaPagamento } from '@/lib/constants'
import type { StatusAgendamento } from '@/lib/constants'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface ClienteLeve {
  id: string
  nome: string
  telefone: string | null
  email: string | null
}

interface ServicoLeve {
  id: string
  nome: string
  duracaoMinutos: number
}

interface Agendamento {
  id: string
  status: StatusAgendamento
  servico: { id: string; nome: string; preco: number; duracaoMinutos: number }
  corEsmalte: { id: string; nome: string; hex: string } | null
  horario: { id: string; data: string; horaInicio: string; horaFim: string }
  cliente: { id: string; nome: string; telefone: string | null; email: string | null; eClienteConfianca: boolean }
  observacoesCliente: string | null
  valorSinal: number | null
}

export function AdminDashboard() {
  const qc = useQueryClient()
  const hoje = hojeStr()
  const [diaSel, setDiaSel] = useState(hoje)
  const [concluirAg, setConcluirAg] = useState<Agendamento | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const dias = Array.from({ length: 7 }, (_, i) => (i === 0 ? hoje : addDias(hoje, i)))

  const { data: agendamentos, isLoading } = useQuery<Agendamento[]>({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const res = await fetch('/api/agendamentos', { credentials: 'include' })
      const j = await res.json()
      return j.agendamentos ?? []
    },
  })

  const aprovar = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agendamentos/${id}/aprovar`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
      toast.success('Agendamento confirmado!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const doDia = agendamentos
    ? agendamentos
        .filter((a) => a.horario.data === diaSel && ['aguardando_sinal', 'confirmado'].includes(a.status))
        .sort((a, b) => a.horario.horaInicio.localeCompare(b.horario.horaInicio))
    : []

  const aguardandoSinal = agendamentos?.filter((a) => a.status === 'aguardando_sinal').length || 0
  const confirmadosHoje = agendamentos?.filter((a) => a.horario.data === hoje && a.status === 'confirmado').length || 0

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">Visão geral dos atendimentos</p>
        </div>
        <Button size="sm" onClick={() => setManualOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Agendar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#E8A33D]/10 border-[#E8A33D]/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-[#E8A33D]" />
              <div>
                <p className="text-2xl font-bold">{aguardandoSinal}</p>
                <p className="text-xs text-muted-foreground">Aguardando sinal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{confirmadosHoje}</p>
                <p className="text-xs text-muted-foreground">Hoje confirmados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {dias.map((data) => {
            const d = parseData(data)
            const ativo = diaSel === data
            const temAg = agendamentos?.some((a) => a.horario.data === data && ['aguardando_sinal', 'confirmado'].includes(a.status))
            return (
              <button
                key={data}
                onClick={() => setDiaSel(data)}
                className={`shrink-0 w-16 py-2.5 rounded-2xl border text-center transition-all relative ${ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}
              >
                <p className="text-[11px] uppercase">{DIAS[d.getDay()]}</p>
                <p className="text-lg font-bold">{d.getDate()}</p>
                {temAg && !ativo && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">{formatDataCurta(diaSel)}</h2>
        {isLoading ? (
          [0, 1].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl mb-3" />)
        ) : doDia.length === 0 ? (
          <Card className="bg-card/50 border-dashed">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhum atendimento neste dia.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {doDia.map((a) => (
              <Card key={a.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AvatarBubble nome={a.cliente.nome} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-serif font-semibold truncate">{a.cliente.nome}</p>
                        {a.cliente.eClienteConfianca && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5" /> Confiança
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-primary font-medium">{a.horario.horaInicio} — {a.servico.nome}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {a.corEsmalte && (
                          <span className="flex items-center gap-1">
                            <span className="h-3.5 w-3.5 rounded-full border border-border" style={esmalteStyle(a.corEsmalte.hex)} />
                            {a.corEsmalte.nome}
                          </span>
                        )}
                        <span className="tabular-nums">R$ {a.servico.preco.toFixed(2).replace('.', ',')}</span>
                        {a.valorSinal && (
                          <span className="text-primary font-medium tabular-nums">Sinal: R$ {a.valorSinal.toFixed(2).replace('.', ',')}</span>
                        )}
                      </div>
                      {a.observacoesCliente && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2">"{a.observacoesCliente}"</p>
                      )}
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {a.status === 'aguardando_sinal' && (
                      <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => aprovar.mutate(a.id)} disabled={aprovar.isPending}>
                        <Check className="h-4 w-4 mr-1" /> Confirmar
                      </Button>
                    )}
                    {a.status === 'confirmado' && (
                      <Button size="sm" className="w-full" onClick={() => setConcluirAg(a)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConcluirDialog agendamento={concluirAg} onClose={() => setConcluirAg(null)} />
      <AgendamentoManualDialog
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        dataInicial={diaSel}
      />
    </div>
  )
}

// Agendamento manual — para quem agenda por telefone ou pessoalmente.
// Escolhe cliente cadastrada (ou cria nova), data, hora e serviço.
function AgendamentoManualDialog({
  open,
  onClose,
  dataInicial,
}: {
  open: boolean
  onClose: () => void
  dataInicial: string
}) {
  const qc = useQueryClient()
  const [modo, setModo] = useState<'existente' | 'nova'>('existente')
  const [clienteId, setClienteId] = useState('')
  const [novaNome, setNovaNome] = useState('')
  const [novaTelefone, setNovaTelefone] = useState('')
  const [novaEmail, setNovaEmail] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [data, setData] = useState(dataInicial)
  const [hora, setHora] = useState('09:00')
  const [obs, setObs] = useState('')
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null)

  const { data: clientes } = useQuery<ClienteLeve[]>({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await fetch('/api/clientes', { credentials: 'include' })
      const j = await res.json()
      return j.clientes ?? []
    },
    enabled: open,
  })

  const { data: servicos } = useQuery<ServicoLeve[]>({
    queryKey: ['servicos'],
    queryFn: async () => {
      const res = await fetch('/api/servicos', { credentials: 'include' })
      const j = await res.json()
      return j.servicos ?? []
    },
    enabled: open,
  })

  const servicoSel = servicos?.find((s) => s.id === servicoId)

  const criar = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/agendamentos/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(modo === 'existente' ? { clienteId } : { novaCliente: { nome: novaNome, telefone: novaTelefone, email: novaEmail } }),
          servicoId,
          data,
          horaInicio: hora,
          observacoes: obs || undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
      qc.invalidateQueries({ queryKey: ['clientes'] })
      qc.invalidateQueries({ queryKey: ['horarios'] })
      hapticSuccess()
      toast.success('Agendamento manual criado!')
      if (d.senhaTemporaria) {
        setSenhaGerada(d.senhaTemporaria)
      } else {
        onClose()
      }
      setNovaNome(''); setNovaTelefone(''); setNovaEmail(''); setObs('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const valido =
    servicoId &&
    (modo === 'existente' ? clienteId : novaNome.trim() && (novaTelefone.trim() || novaEmail.trim()))

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Agendamento manual
          </DialogTitle>
        </DialogHeader>

        {senhaGerada ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cliente criada e agendamento confirmado! Compartilhe a senha temporária com a cliente — ela
              poderá trocá-la depois no perfil:
            </p>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">Senha temporária</p>
              <p className="text-xl font-mono font-bold tracking-wider">{senhaGerada}</p>
            </div>
            <DialogFooter>
              <Button onClick={onClose}>Entendi</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setModo('existente')}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${modo === 'existente' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
              >
                Cliente cadastrada
              </button>
              <button
                onClick={() => setModo('nova')}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${modo === 'nova' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
              >
                Nova cliente
              </button>
            </div>

            {modo === 'existente' ? (
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a cliente" /></SelectTrigger>
                  <SelectContent>
                    {(clientes ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}{c.telefone ? ` · ${c.telefone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="m-nome">Nome</Label>
                  <Input id="m-nome" value={novaNome} onChange={(e) => setNovaNome(e.target.value)} placeholder="Nome da cliente" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="m-tel">Telefone (WhatsApp)</Label>
                    <Input id="m-tel" value={novaTelefone} onChange={(e) => setNovaTelefone(e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="m-email">E-mail (opcional)</Label>
                    <Input id="m-email" type="email" value={novaEmail} onChange={(e) => setNovaEmail(e.target.value)} placeholder="cliente@exemplo.com" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  A cliente recebe uma senha temporária para acessar a plataforma.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select value={servicoId} onValueChange={setServicoId}>
                <SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                <SelectContent>
                  {(servicos ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome} · {s.duracaoMinutos} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="m-data">Data</Label>
                <Input id="m-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-hora">Hora de início</Label>
                <Input id="m-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
              </div>
            </div>
            {servicoSel && (
              <p className="text-xs text-muted-foreground -mt-2">
                Duração do serviço: {servicoSel.duracaoMinutos} min — termina às{' '}
                {(() => {
                  const [h, m] = hora.split(':').map(Number)
                  const total = h * 60 + m + servicoSel.duracaoMinutos
                  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
                })()}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="m-obs">Observações (opcional)</Label>
              <Input id="m-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: agendado por telefone" />
            </div>
          </div>
        )}

        {!senhaGerada && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => criar.mutate()} disabled={!valido || criar.isPending}>
              {criar.isPending ? 'Criando...' : 'Criar agendamento'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ConcluirDialog({ agendamento, onClose }: { agendamento: Agendamento | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [valor, setValor] = useState('')
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [corUsada, setCorUsada] = useState('')
  const [obs, setObs] = useState('')

  const concluir = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agendamentos/${agendamento!.id}/concluir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valorPago: valor ? Number(valor) : agendamento!.servico.preco,
          formaPagamento: forma,
          corUsada: corUsada || undefined,
          observacoes: obs || undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
      qc.invalidateQueries({ queryKey: ['caixa'] })
      hapticSuccess()
      confetti({ emojis: ['💰', '💅', '✨'] })
      toast.success('Atendimento concluído!')
      setValor(''); setForma('pix'); setCorUsada(''); setObs('')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={!!agendamento} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir atendimento</DialogTitle>
        </DialogHeader>
        {agendamento && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{agendamento.cliente.nome}</span> — {agendamento.servico.nome}
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor recebido (R$)</Label>
              <Input id="valor" type="number" step="0.01" placeholder={agendamento.servico.preco.toFixed(2)} value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamento)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(FORMA_PAGAMENTO).map((f) => (
                    <SelectItem key={f} value={f}>{FORMA_PAGAMENTO_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cor">Cor usada (opcional)</Label>
              <Input id="cor" value={corUsada} onChange={(e) => setCorUsada(e.target.value)} placeholder={agendamento.corEsmalte?.nome || 'Ex: Rosa Tainails'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Input id="obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Notas sobre o atendimento" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => concluir.mutate()} disabled={concluir.isPending}>{concluir.isPending ? 'Salvando...' : 'Concluir'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
