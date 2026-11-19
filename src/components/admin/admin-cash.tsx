'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet } from 'lucide-react'
import { hojeStr, addDias } from '@/lib/format'
import { FORMA_PAGAMENTO_LABELS, type FormaPagamento } from '@/lib/constants'

interface Transacao {
  id: string
  valor: number
  formaPagamento: string
  data: string
  observacao: string | null
  agendamento: { servico: { nome: string } } | null
}

export function AdminCash() {
  const hoje = hojeStr()
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes'>('hoje')

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

  const total = filtradas.reduce((s, t) => s + t.valor, 0)
  const porForma = filtradas.reduce((acc, t) => {
    acc[t.formaPagamento] = (acc[t.formaPagamento] || 0) + t.valor
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-serif font-bold">Caixa</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seus ganhos</p>
      </div>

      <div className="flex gap-2">
        {(['hoje', 'semana', 'mes'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${periodo === p ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}
          >
            {p === 'hoje' ? 'Hoje' : p === 'semana' ? '7 dias' : '30 dias'}
          </button>
        ))}
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/15 to-transparent glass glass-highlight">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total recebido</p>
              <p className="text-2xl font-serif font-bold text-primary tabular-nums">R$ {total.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.keys(porForma).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Por forma de pagamento</h2>
          <div className="space-y-2">
            {Object.entries(porForma).map(([forma, valor]) => (
              <Card key={forma} className="bg-card border-border">
                <CardContent className="p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {FORMA_PAGAMENTO_LABELS[forma as FormaPagamento] || forma}
                  </span>
                  <span className="font-semibold">R$ {valor.toFixed(2).replace('.', ',')}</span>
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
            {filtradas.map((t) => (
              <Card key={t.id} className="bg-card border-border">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.agendamento?.servico?.nome || 'Transação'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {FORMA_PAGAMENTO_LABELS[t.formaPagamento as FormaPagamento] || t.formaPagamento} · {t.data.split('-').reverse().join('/')}
                    </p>
                  </div>
                  <p className="font-bold text-emerald-600 shrink-0">+ R$ {t.valor.toFixed(2).replace('.', ',')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
