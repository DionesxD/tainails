'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Scissors, Plus, Clock, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  preco: number
  duracaoMinutos: number
  ativo: boolean
}

interface FormServico {
  nome: string
  descricao: string
  preco: string
  duracao: string
}

const formVazio: FormServico = { nome: '', descricao: '', preco: '', duracao: '' }

export function AdminServices() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [editando, setEditando] = useState<Servico | null>(null)
  const [form, setForm] = useState<FormServico>(formVazio)

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
        body: JSON.stringify({ nome: form.nome, descricao: form.descricao, preco: Number(form.preco.replace(',', '.')), duracaoMinutos: Number(form.duracao) }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicos'] })
      toast.success('Serviço adicionado!')
      setAddOpen(false); setForm(formVazio)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const editar = useMutation({
    mutationFn: async () => {
      if (!editando) throw new Error('Selecione um serviço')
      const res = await fetch(`/api/servicos/${editando.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          descricao: form.descricao,
          preco: Number(form.preco.replace(',', '.')),
          duracaoMinutos: Number(form.duracao),
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servicos'] })
      toast.success('Serviço atualizado!')
      setEditando(null); setForm(formVazio)
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

  const abrirEdicao = (s: Servico) => {
    setEditando(s)
    setForm({
      nome: s.nome,
      descricao: s.descricao ?? '',
      preco: String(s.preco),
      duracao: String(s.duracaoMinutos),
    })
  }

  const formValido = form.nome.trim() && Number(form.preco.replace(',', '.')) >= 0 && Number(form.duracao) > 0

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">{servicos?.length || 0} cadastrados</p>
        </div>
        <Button size="sm" onClick={() => { setForm(formVazio); setAddOpen(true) }}>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => abrirEdicao(s)}
                      aria-label={`Editar ${s.nome}`}
                      title="Editar serviço"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => toggleAtivo.mutate({ id: s.id, ativo: !s.ativo })} className="text-[10px] text-primary hover:underline press">
                      {s.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
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
          <FormularioServico form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={() => add.mutate()} disabled={!formValido || add.isPending}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editando} onOpenChange={(o) => { if (!o) { setEditando(null); setForm(formVazio) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar serviço</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">{editando?.nome}</p>
          <FormularioServico form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditando(null); setForm(formVazio) }}>Cancelar</Button>
            <Button onClick={() => editar.mutate()} disabled={!formValido || editar.isPending}>
              {editar.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FormularioServico({ form, setForm }: {
  form: FormServico
  setForm: React.Dispatch<React.SetStateAction<FormServico>>
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="s-nome">Nome</Label>
        <Input id="s-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex: Esmaltação em gel" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="s-desc">Descrição (opcional)</Label>
        <Input id="s-desc" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes do serviço" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="s-preco">Preço (R$)</Label>
          <Input id="s-preco" type="number" step="0.01" inputMode="decimal" value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))} placeholder="80.00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-dur">Duração (min)</Label>
          <Input id="s-dur" type="number" value={form.duracao} onChange={(e) => setForm((f) => ({ ...f, duracao: e.target.value }))} placeholder="60" />
        </div>
      </div>
    </div>
  )
}
