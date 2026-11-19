'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Images, Plus, Trash2, Upload } from 'lucide-react'
import { ImageTrack } from '@/components/image-track'
import { toast } from 'sonner'

interface Modelo {
  id: string
  urlImagem: string
  descricao: string | null
  tags: string[]
  ativo: boolean
}

export function AdminGallery() {
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tags, setTags] = useState('')

  const { data: modelos, isLoading } = useQuery<Modelo[]>({
    queryKey: ['galeria'],
    queryFn: async () => {
      const res = await fetch('/api/galeria', { credentials: 'include' })
      const j = await res.json()
      return j.modelos ?? []
    },
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'public')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d.url as string
    },
    onSuccess: (urlUploaded) => {
      setUrl(urlUploaded)
      toast.success('Imagem enviada!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const addModelo = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/galeria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlImagem: url,
          descricao,
          tags: tags ? tags.split(',').map((t) => t.trim()) : [],
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['galeria'] })
      toast.success('Modelo adicionado!')
      setAddOpen(false); setUrl(''); setDescricao(''); setTags('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const res = await fetch(`/api/galeria/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['galeria'] }),
  })

  const deletar = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/galeria/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['galeria'] })
      toast.success('Modelo removido.')
    },
  })

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold">Galeria</h1>
          <p className="text-sm text-muted-foreground">{modelos?.length || 0} modelos</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {/* Vitrine arrastável (adaptada do CodePen image track) */}
      {!isLoading && modelos && modelos.length > 0 && (
        <section className="-mx-4">
          <ImageTrack
            images={modelos.map((m) => ({ id: m.id, url: m.urlImagem, alt: m.descricao }))}
          />
          <p className="text-center text-[10px] text-muted-foreground py-1.5">
            arraste para explorar ✨
          </p>
        </section>
      )}

      {isLoading ? (
        <div className="h-40 w-full rounded-2xl shimmer" />
      ) : !modelos || modelos.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="p-8 text-center">
            <Images className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum modelo na galeria.</p>
          </CardContent>
        </Card>
      ) : (
        <>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gerenciar modelos</p>
        <div className="grid grid-cols-2 gap-3">
          {modelos.map((m) => (
            <Card key={m.id} className={`bg-card border-border overflow-hidden ${!m.ativo ? 'opacity-50' : ''}`}>
              <div className="aspect-square bg-muted relative">
                <img src={m.urlImagem} alt={m.descricao || 'Modelo'} className="h-full w-full object-cover" />
                <button
                  onClick={() => deletar.mutate(m.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/90 text-white hover:bg-destructive press"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{m.descricao || 'Modelo'}</p>
                <button
                  onClick={() => toggleAtivo.mutate({ id: m.id, ativo: !m.ativo })}
                  className="text-[10px] text-primary hover:underline mt-1 press"
                >
                  {m.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      )}

      {/* Dialog adicionar */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar modelo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {url ? (
              <img src={url} alt="Preview" className="w-full rounded-xl max-h-48 object-cover" />
            ) : (
              <label className="block">
                <div className="border-1.5 border-dashed border-primary rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-primary/5">
                  <Upload className="h-6 w-6 text-primary" />
                  <p className="text-sm text-muted-foreground">Enviar imagem</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f) }}
                />
              </label>
            )}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Francesinha com glitter" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ex: gel, glitter, rosa" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={() => addModelo.mutate()} disabled={!url || addModelo.isPending}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
