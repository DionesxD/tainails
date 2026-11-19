'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Scissors, Plus, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  preco: number
  duracaoMinutos: number
  ativo: boolean
}

export function AdminServices() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [duracao, setDuracao] = useState('')

  const { data: servicos, isLoading } = useQuery<Servico[]>({
    queryKey: ['servicos'],
    queryFn: async () => {
      const res = await fetch('/api/servicos', { credentials: 'include' })
      const j = await res.json()
      return j.servicos ?? []
    },
  })

  const add = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, descricao, preco: Number(preco), duracaoMinutos: Number(duracao) }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicos'] })
      toast.success('Serviço adicionado!')
      setAddOpen(false); setNome(''); setDescricao(''); setPreco(''); setDuracao('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const res = await fetch(`/api/servicos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo }),
      })
      if (!res.ok) throw new Error('Erro')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servicos'] }),
  })

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">{servicos?.length || 0} cadastrados</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {isLoading ? (
        <div className="h-20 w-full rounded-2xl shimmer" />
      ) : !servicos || servicos.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-8 text-center">
            <Scissors className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {servicos.map((s) => (
            <Card key={s.id} className={`bg-card border-border ${!s.ativo ? 'opacity-50' : ''}`}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-serif font-semibold truncate">{s.nome}</p>
                  {s.descricao && <p className="text-xs text-muted-foreground truncate">{s.descricao}</p>}
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {s.duracaoMinutos} min
                  </p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <p className="font-bold text-primary tabular-nums">R$ {s.preco.toFixed(2).replace('.', ',')}</p>
                  <button onClick={() => toggleAtivo.mutate({ id: s.id, ativo: !s.ativo })} className="text-[10px] text-primary hover:underline press">
                    {s.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-nome">Nome</Label>
              <Input id="s-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Esmaltação em gel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-desc">Descrição (opcional)</Label>
              <Input id="s-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Dethes do serviço" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="s-preco">Preço (R$)</Label>
                <Input id="s-preco" type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="80.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-dur">Duração (min)</Label>
                <Input id="s-dur" type="number" value={duracao} onChange={(e) => setDuracao(e.target.value)} placeholder="60" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={() => add.mutate()} disabled={!nome || !preco || add.isPending}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
