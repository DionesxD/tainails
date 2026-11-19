'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { hojeStr, addDias } from '@/lib/format'
import {
  FORMA_PAGAMENTO,
  FORMA_PAGAMENTO_LABELS,
  CATEGORIA_GASTO,
  CATEGORIA_GASTO_LABELS,
  type FormaPagamento,
  type CategoriaGasto,
  type TipoTransacao,
} from '@/lib/constants'

interface Transacao {
  id: string
  valor: number
  tipo: string
  categoria: string | null
  formaPagamento: string
  data: string
  observacao: string | null
  agendamentoId: string | null
  agendamento: { servico: { nome: string }; cliente: { nome: string } } | null
}

const PERIODOS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: '7 dias' },
  { id: 'mes', label: '30 dias' },
] as const
type Periodo = (typeof PERIODOS)[number]['id']

function fmtBRL(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

export function AdminCash() {
  const qc = useQueryClient()
  const hoje = hojeStr()
  const [periodo, setPeriodo] = useState<Periodo>('hoje')
  const [lancamentoOpen, setLancamentoOpen] = useState(false)
  const [excluir, setExcluir] = useState<Transacao | null>(null)

  const { data: transacoes, isLoading } = useQuery<Transacao[]>({
    queryKey: ['caixa'],
    queryFn: async () => {
      const res = await fetch('/api/caixa/relatorio', { credentials: 'include' })
      const j = await res.json()
      return j.transacoes ?? []
    },
  })

  const filtradas = transacoes?.filter((t) => {
    if (periodo === 'hoje') return t.data === hoje
    if (periodo === 'semana') return t.data >= addDias(hoje, -7)
    return t.data >= addDias(hoje, -30)
  }) || []

  const ganhos = filtradas.filter((t) => t.tipo !== 'gasto').reduce((s, t) => s + t.valor, 0)
  const gastos = filtradas.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.valor, 0)
  const saldo = ganhos - gastos

  const porForma = filtradas
    .filter((t) => t.tipo !== 'gasto')
    .reduce((acc, t) => {
      acc[t.formaPagamento] = (acc[t.formaPagamento] || 0) + t.valor
      return acc
    }, {} as Record<string, number>)

  const excluirMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/caixa/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caixa'] })
      toast.success('Lançamento excluído.')
      setExcluir(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold">Caixa</h1>
          <p className="text-sm text-muted-foreground">Ganhos, gastos e saldo do período</p>
        </div>
        <Button size="sm" onClick={() => setLancamentoOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Lançar
        </Button>
      </div>

      <div className="flex gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${periodo === p.id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-transparent glass glass-highlight">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <p className="text-xs text-muted-foreground">Ganhos</p>
            </div>
            <p className="text-xl font-serif font-bold text-emerald-600 tabular-nums mt-1">{fmtBRL(ganhos)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-gradient-to-br from-red-500/15 to-transparent glass glass-highlight">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <p className="text-xs text-muted-foreground">Gastos</p>
            </div>
            <p className="text-xl font-serif font-bold text-red-500 tabular-nums mt-1">{fmtBRL(gastos)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/15 to-transparent glass glass-highlight">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo no período</p>
              <p className="text-2xl font-serif font-bold text-primary tabular-nums">{fmtBRL(saldo)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.keys(porForma).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Ganhos por forma de pagamento</h2>
          <div className="space-y-2">
            {Object.entries(porForma).map(([forma, valor]) => (
              <Card key={forma} className="bg-card border-border">
                <CardContent className="p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {FORMA_PAGAMENTO_LABELS[forma as FormaPagamento] || forma}
                  </span>
                  <span className="font-semibold">{fmtBRL(valor)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Transações</h2>
        {isLoading ? (
          <Skeleton className="h-20 w-full rounded-2xl" />
        ) : filtradas.length === 0 ? (
          <Card className="bg-card/50 border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhuma transação no período.</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtradas.map((t) => {
              const eGasto = t.tipo === 'gasto'
              const titulo = eGasto
                ? (t.categoria ? CATEGORIA_GASTO_LABELS[t.categoria as CategoriaGasto] || t.categoria : 'Gasto')
                : t.agendamento
                  ? `${t.agendamento.servico.nome}${t.agendamento.cliente ? ` · ${t.agendamento.cliente.nome}` : ''}`
                  : 'Ganho extra'
              return (
                <Card key={t.id} className="bg-card border-border">
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate flex items-center gap-1.5">
                        {eGasto
                          ? <ArrowDownCircle className="h-4 w-4 text-red-500 shrink-0" />
                          : <ArrowUpCircle className="h-4 w-4 text-emerald-600 shrink-0" />}
                        <span className="truncate">{titulo}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {eGasto
                          ? `${t.observacao ? `${t.observacao} · ` : ''}${t.data.split('-').reverse().join('/')}`
                          : `${FORMA_PAGAMENTO_LABELS[t.formaPagamento as FormaPagamento] || t.formaPagamento}${t.observacao ? ` · ${t.observacao}` : ''} · ${t.data.split('-').reverse().join('/')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <p className={`font-bold tabular-nums ${eGasto ? 'text-red-500' : 'text-emerald-600'}`}>
                        {eGasto ? '−' : '+'} {fmtBRL(t.valor)}
                      </p>
                      {!t.agendamentoId && (
                        <button
                          onClick={() => setExcluir(t)}
                          aria-label="Excluir lançamento"
                          title="Excluir lançamento manual"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <LancamentoDialog open={lancamentoOpen} onClose={() => setLancamentoOpen(false)} />

      <Dialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir lançamento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Excluir {excluir?.tipo === 'gasto' ? 'o gasto' : 'o ganho extra'} de {excluir ? fmtBRL(excluir.valor) : ''}?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExcluir(null)}>Cancelar</Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => excluir && excluirMut.mutate(excluir.id)}
              disabled={excluirMut.isPending}
            >
              {excluirMut.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LancamentoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [tipo, setTipo] = useState<TipoTransacao>('ganho')
  const [valor, setValor] = useState('')
  const [forma, setForma] = useState<FormaPagamento>('pix')
  const [categoria, setCategoria] = useState<CategoriaGasto>('equipamento')
  const [data, setData] = useState(hojeStr())
  const [observacao, setObservacao] = useState('')

  const lancar = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          valor: Number(valor.replace(',', '.')),
          formaPagamento: forma,
          data,
          ...(tipo === 'gasto' ? { categoria } : {}),
          observacao: observacao || undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caixa'] })
      toast.success(tipo === 'gasto' ? 'Gasto registrado no caixa.' : 'Ganho extra registrado no caixa!')
      setValor(''); setObservacao('')
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lançar no caixa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTipo('ganho')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${tipo === 'ganho' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-border text-muted-foreground'}`}
            >
              <TrendingUp className="h-4 w-4" /> Ganho extra
            </button>
            <button
              onClick={() => setTipo('gasto')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${tipo === 'gasto' ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-border text-muted-foreground'}`}
            >
              <TrendingDown className="h-4 w-4" /> Gasto / retirada
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="l-valor">Valor (R$)</Label>
              <Input
                id="l-valor"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={tipo === 'ganho' ? 'Ex: 25.00' : 'Ex: 80.00'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-data">Data</Label>
              <Input id="l-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
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

          {tipo === 'gasto' && (
            <div className="space-y-2">
              <Label>Categoria do gasto</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaGasto)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(CATEGORIA_GASTO).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORIA_GASTO_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="l-obs">
              {tipo === 'ganho' ? 'Descrição (opcional)' : 'Observação (opcional)'}
            </Label>
            <Input
              id="l-obs"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder={tipo === 'ganho' ? 'Ex: Segundo serviço — alongamento' : 'Ex: Compra de acrílico'}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            type="button"
            onClick={() => lancar.mutate()}
            disabled={!valor || Number(valor.replace(',', '.')) <= 0 || lancar.isPending}
          >
            {lancar.isPending ? 'Lançando...' : 'Lançar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
