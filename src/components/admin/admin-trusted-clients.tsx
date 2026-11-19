'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AvatarBubble } from '@/components/avatar-bubble'
import { KeyRound, Search, Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Cliente {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  eClienteConfianca: boolean
  jaAgendou: boolean
}

export function AdminTrustedClients() {
  const qc = useQueryClient()
  const [clienteSenha, setClienteSenha] = useState<Cliente | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [busca, setBusca] = useState('')

  const { data: clientes, isLoading } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await fetch('/api/clientes', { credentials: 'include' })
      const j = await res.json()
      return j.clientes ?? []
    },
  })

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return clientes ?? []
    return (clientes ?? []).filter((c) =>
      c.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
      (c.telefone ?? '').includes(termo) ||
      (c.email ?? '').toLocaleLowerCase('pt-BR').includes(termo)
    )
  }, [clientes, busca])

  const total = clientes?.length ?? 0
  const semAgendamento = (clientes ?? []).filter((c) => !c.jaAgendou).length

  const toggleConfianca = useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: boolean }) => {
      const res = await fetch(`/api/clientes/${id}/confianca`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eClienteConfianca: valor }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      toast.success(vars.valor ? 'Cliente marcada como confiança ⭐' : 'Cliente removida da confiança')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const redefinirSenha = useMutation({
    mutationFn: async () => {
      if (!clienteSenha) throw new Error('Selecione uma cliente')
      const res = await fetch(`/api/clientes/${clienteSenha.id}/senha`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novaSenha }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não foi possível redefinir a senha')
    },
    onSuccess: () => {
      toast.success('Senha redefinida. Compartilhe a nova senha com a cliente por um canal seguro.')
      setClienteSenha(null)
      setNovaSenha('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-serif font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Todas as clientes cadastradas
          {total > 0 && <> — {total} no total{semAgendamento > 0 && <> · {semAgendamento} sem 1º agendamento</>}</>}
        </p>
      </div>

      {total > 4 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail..." className="pl-9" />
        </div>
      )}

      {isLoading ? (
        <div className="h-20 w-full rounded-2xl shimmer" />
      ) : filtradas.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {busca ? 'Nenhuma cliente encontrada para esta busca.' : 'Nenhuma cliente cadastrada ainda.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtradas.map((c) => (
            <Card key={c.id} className={cn('bg-card border-border', c.eClienteConfianca && 'border-primary/30')}>
              <CardContent className="p-3 flex items-center gap-2">
                <AvatarBubble nome={c.nome} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate flex items-center gap-1.5">
                    <span className="truncate">{c.nome}</span>
                    {!c.jaAgendou && <span className="shrink-0 rounded-full border border-border bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">1º pendente</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{c.telefone || c.email || '—'}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`Redefinir senha de ${c.nome}`}
                  title="Redefinir senha da cliente"
                  onClick={() => { setClienteSenha(c); setNovaSenha('') }}
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => toggleConfianca.mutate({ id: c.id, valor: !c.eClienteConfianca })}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-95',
                    c.eClienteConfianca
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <Star className={cn('h-3.5 w-3.5', c.eClienteConfianca && 'fill-current')} />
                  <span className="text-xs font-medium">{c.eClienteConfianca ? 'Confiança' : 'Marcar'}</span>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!clienteSenha} onOpenChange={(open) => { if (!open) setClienteSenha(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha da cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Crie uma senha temporária para {clienteSenha?.nome}. Compartilhe-a diretamente com a cliente.
          </p>
          <div className="space-y-2">
            <Label htmlFor="senha-temporaria">Nova senha</Label>
            <Input
              id="senha-temporaria"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClienteSenha(null)}>Cancelar</Button>
            <Button
              type="button"
              onClick={() => redefinirSenha.mutate()}
              disabled={novaSenha.length < 8 || redefinirSenha.isPending}
            >
              {redefinirSenha.isPending ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
