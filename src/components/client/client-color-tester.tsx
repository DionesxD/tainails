'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Hash, Sparkles, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useColorSelectionStore } from '@/components/client/color-selection-store'
import { HandModelLayers } from '@/components/client/hand-model-layers'
import { esmalteStyle } from '@/lib/format'
import { useAuthStore } from '@/components/auth-provider'
import { cn } from '@/lib/utils'

interface Cor {
  id: string
  nome: string
  hex: string
  categoria: string | null
}

const FAV_KEY = 'tainails:favoritas'

function loadFavs(userId?: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${FAV_KEY}:${userId || 'anon'}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveFavs(userId: string | undefined, ids: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${FAV_KEY}:${userId || 'anon'}`, JSON.stringify(ids))
}

const CATEGORIA_LABELS: Record<string, string> = {
  todas: 'Todas',
  nude: 'Nudes',
  rosa: 'Rosas & Glam',
  vermelho: 'Vermelhos & Vinho',
  pastel: 'Pastéis & Candy',
  terroso: 'Terrosos',
  escuro: 'Escuros & Chic',
  azul: 'Azuis',
  verde: 'Verdes',
  metalico: 'Metálicos & Brilhos',
}

export function ClientColorTester() {
  const user = useAuthStore((s) => s.user)
  const [corId, setCorId] = useState<string | null>(null)
  const [hexCustom, setHexCustom] = useState('')
  const [filtroCat, setFiltroCat] = useState<string>('todas')
  const { setCor } = useColorSelectionStore()
  const [favoritas, setFavoritas] = useState<string[]>([])

  useEffect(() => { setFavoritas(loadFavs(user?.id)) }, [user?.id])

  function toggleFavorita(id: string) {
    setFavoritas((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      saveFavs(user?.id, next)
      return next
    })
  }
  const isFavorita = (id: string) => favoritas.includes(id)

  const { data: cores, isLoading } = useQuery({
    queryKey: ['cores'],
    queryFn: async () => {
      const res = await fetch('/api/cores', { credentials: 'include' })
      const j = await res.json()
      return (j.cores ?? []) as Cor[]
    },
  })

  const { data: historicoCores } = useQuery({
    queryKey: ['agendamentos-cores', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch('/api/agendamentos')
      const j = await res.json()
      const ags = j.agendamentos as Array<{ corEsmalte: { id: string; nome: string; hex: string } | null }>
      const vistos = new Set<string>()
      return ags
        .filter((a) => a.corEsmalte)
        .filter((a) => {
          if (vistos.has(a.corEsmalte!.id)) return false
          vistos.add(a.corEsmalte!.id)
          return true
        })
        .slice(0, 3)
        .map((a) => a.corEsmalte!)
    },
  })

  const coresFav = cores?.filter((c) => favoritas.includes(c.id)) || []
  const corSel = cores?.find((c) => c.id === corId)
  const corHex = hexCustom || corSel?.hex || '#C8C8C8'

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      const original = meta.getAttribute('content')
      meta.setAttribute('content', corHex)
      return () => { if (original) meta.setAttribute('content', original) }
    }
  }, [corHex])

  const categorias = ['todas', ...(cores ? Array.from(new Set(cores.map((c) => c.categoria || 'outros'))).sort() : [])]
  const coresFiltradas = cores
    ? filtroCat === 'todas' ? cores : cores.filter((c) => (c.categoria || 'outros') === filtroCat)
    : []
  const sugestoes = cores ? cores.filter((c) => c.id !== corId).slice(0, 4) : []

  function aplicarHex() {
    let hex = hexCustom.trim()
    if (!hex) return
    if (!hex.startsWith('#')) hex = '#' + hex
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      toast.error('Código inválido. Use o formato #RRGGBB (ex: D85A78).')
      return
    }
    setCorId(null)
    setHexCustom(hex)
    toast.success('Cor personalizada aplicada!')
  }

  function selecionarCor(c: Cor) {
    setCorId(c.id)
    setHexCustom('')
  }

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-serif font-bold">Provador de cores</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Experimente os esmaltes no modelo de mão</p>
      </div>

      <Card className="glass glass-highlight border-border">
        <CardContent className="p-4 space-y-3">
          <div className="relative w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-muted/30 to-muted/10 border border-border">
            <HandModelLayers corHex={corHex} />
            {(corSel || hexCustom) && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/85 backdrop-blur text-xs font-medium">
                <span className="h-3.5 w-3.5 rounded-full border border-border" style={esmalteStyle(corHex)} />
                {corSel?.nome || hexCustom.toUpperCase()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-bold flex items-center gap-1.5 mb-1">
          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs grid place-items-center">1</span>
          Escolha a cor
        </h2>
        <p className="text-xs text-muted-foreground mb-3">Selecione uma cor da paleta.</p>

        {(coresFav.length > 0 || (historicoCores && historicoCores.length > 0)) && (
          <div className="space-y-3 mb-4">
            {coresFav.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Heart className="h-3 w-3 fill-primary text-primary" /> Favoritas
                </p>
                <div className="flex gap-2 overflow-x-auto scrollbar-thin -mx-1 px-1">
                  {coresFav.map((c) => (
                    <button key={c.id} onClick={() => selecionarCor(c)} title={c.nome} className="shrink-0 flex flex-col items-center gap-1 w-14">
                      <span className={cn('h-10 w-10 rounded-full border-2 transition-all', corId === c.id && !hexCustom ? 'border-primary ring-2 ring-primary/30' : 'border-border')} style={esmalteStyle(c.hex)} />
                      <span className="text-[9px] text-muted-foreground leading-tight text-center line-clamp-1 w-full">{c.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {historicoCores && historicoCores.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Usadas recentemente
                </p>
                <div className="flex gap-2 overflow-x-auto scrollbar-thin -mx-1 px-1">
                  {historicoCores.map((c) => {
                    const cor = cores?.find((co) => co.id === c.id)
                    if (!cor) return null
                    return (
                      <button key={c.id} onClick={() => selecionarCor(cor)} title={c.nome} className="shrink-0 flex flex-col items-center gap-1 w-14">
                        <span className={cn('h-10 w-10 rounded-full border-2 transition-all', corId === c.id && !hexCustom ? 'border-primary ring-2 ring-primary/30' : 'border-border')} style={esmalteStyle(c.hex)} />
                        <span className="text-[9px] text-muted-foreground leading-tight text-center line-clamp-1 w-full">{c.nome}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin -mx-1 px-1 mb-3">
          {categorias.map((cat) => (
            <button key={cat} onClick={() => setFiltroCat(cat)} className={cn('shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium capitalize transition-all', filtroCat === cat ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card/70 hover:bg-card text-muted-foreground')}>
              {CATEGORIA_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (
          <div className="grid grid-cols-5 gap-2.5">
            {coresFiltradas.map((c) => {
              const ativo = corId === c.id && !hexCustom
              const fav = isFavorita(c.id)
              return (
                <div key={c.id} className="relative flex flex-col items-center gap-1">
                  <button onClick={() => selecionarCor(c)} title={c.nome} className="flex flex-col items-center gap-1 w-full">
                    <span className={cn('h-11 w-11 rounded-full border-2 transition-all active:scale-90', ativo ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-border')} style={esmalteStyle(c.hex)} />
                    <span className="text-[9px] text-muted-foreground leading-tight text-center line-clamp-1 w-full">{c.nome}</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorita(c.id) }} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background/80 backdrop-blur grid place-items-center border border-border" title={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
                    <Heart className={cn('h-3 w-3 transition-all', fav ? 'fill-primary text-primary scale-110' : 'text-muted-foreground')} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={hexCustom} onChange={(e) => setHexCustom(e.target.value)} placeholder="Inserir código da cor (ex: D85A78)" className="pl-9 uppercase" onKeyDown={(e) => { if (e.key === 'Enter') aplicarHex() }} />
          </div>
          <Button onClick={aplicarHex} title="Aplicar código">Aplicar</Button>
        </div>
      </div>

      {(corSel || hexCustom) && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/30 animate-fade-in-up">
          <span className="h-12 w-12 rounded-full border-2 border-background" style={esmalteStyle(corHex)} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{corSel?.nome || 'Cor personalizada'}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{corHex}</p>
          </div>
          <Button size="sm" onClick={() => { setCor({ corId: corSel?.id || 'custom', nome: corSel?.nome || corHex.toUpperCase(), hex: corHex }); toast.success('Cor salva! Ela será sugerida ao agendar.') }}>
            <Check className="h-4 w-4 mr-1" /> Salvar
          </Button>
        </div>
      )}

      {sugestoes.length > 0 && (
        <div>
          <h2 className="text-sm font-bold flex items-center gap-1.5 mb-1">
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs grid place-items-center">3</span>
            Experimente outras cores
          </h2>
          <p className="text-xs text-muted-foreground mb-3">Troque entre as cores e veja qual combina mais com você.</p>
          <div className="grid grid-cols-4 gap-2">
            {sugestoes.map((c) => (
              <button key={c.id} onClick={() => selecionarCor(c)} className="rounded-xl border border-border bg-card overflow-hidden active:scale-95 transition-transform">
                <div className="aspect-[512/671] bg-muted relative">
                  <HandModelLayers corHex={c.hex} />
                </div>
                <div className="p-1.5">
                  <p className="text-[9px] font-medium truncate">{c.nome}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                    <span className="text-[8px] text-muted-foreground capitalize">{c.categoria}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground">
        <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p>Dica: escolha uma cor da paleta ou digite um código hex personalizado, depois salve para usar ao agendar.</p>
      </div>
    </div>
  )
}
