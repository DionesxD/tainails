'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Check, Clock, Tag, Palette, Copy, Upload, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDataCurta, semanaDeAte, parseData, esmalteStyle } from '@/lib/format'
import { useColorSelectionStore } from '@/components/client/color-selection-store'
import { useAuthStore } from '@/components/auth-provider'
import { cn } from '@/lib/utils'

interface Servico {
  id: string
  nome: string
  descricao: string | null
  preco: number
  duracaoMinutos: number
}
interface Horario {
  id: string
  data: string
  horaInicio: string
  horaFim: string
  status: string
}
interface Cor {
  id: string
  nome: string
  hex: string
  categoria: string | null
}
interface Configuracoes {
  exigeSinal: boolean
  percentualSinal: number
  prazoEnvioSinalHoras: number
  chavePix: string | null
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function ClientBooking() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [servicoId, setServicoId] = useState<string | null>(null)
  const [horarioId, setHorarioId] = useState<string | null>(null)
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)
  const [corId, setCorId] = useState<string | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null)
  const [comprovantePreview, setComprovantePreview] = useState<string | null>(null)
  const corSalva = useColorSelectionStore((s) => s.cor)
  const [corPreAplicada, setCorPreAplicada] = useState(false)

  const { data: servicos, isLoading: loadingServ } = useQuery({
    queryKey: ['servicos'],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch('/api/servicos', { credentials: 'include' })
      const j = await res.json()
      return (j.servicos ?? []) as Servico[]
    },
  })
  const { data: horarios, isLoading: loadingHor } = useQuery({
    queryKey: ['horarios'],
    queryFn: async () => {
      const res = await fetch('/api/horarios', { credentials: 'include' })
      const j = await res.json()
      return (j.horarios ?? []) as Horario[]
    },
  })
  const { data: cores } = useQuery({
    queryKey: ['cores'],
    queryFn: async () => {
      const res = await fetch('/api/cores', { credentials: 'include' })
      const j = await res.json()
      return (j.cores ?? []) as Cor[]
    },
  })
  const { data: config } = useQuery<Configuracoes>({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const res = await fetch('/api/configuracoes', { credentials: 'include' })
      const j = await res.json()
      return j.configuracoes
    },
  })

  useEffect(() => {
    if (corSalva && !corPreAplicada && cores) {
      const existe = cores.find((c) => c.id === corSalva.corId)
      if (existe) {
        setCorId(existe.id)
        setCorPreAplicada(true)
      }
    }
  }, [cores, corSalva, corPreAplicada])

  const diasDisponiveis = horarios ? Array.from(new Set(horarios.map((h) => h.data))).sort() : []
  const horariosDoDia = horarios ? horarios.filter((h) => h.data === diaSelecionado && h.status === 'livre') : []

  const submit = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horarioId,
          servicoId,
          corEsmalteId: corId || undefined,
          observacoes: observacoes || undefined,
          comprovanteUrl: comprovanteUrl || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao solicitar')
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['agendamentos'] })
      qc.invalidateQueries({ queryKey: ['horarios'] })
      if (data.agendamento.confirmadoAutomaticamente) {
        toast.success('Agendamento confirmado! Cliente de confiança 🎉')
      } else if (comprovanteUrl) {
        toast.success('Agendamento enviado com comprovante! Aguarde aprovação.')
      } else {
        toast.success('Solicitação enviada! Envie o comprovante do sinal.')
      }
      setStep(1); setServicoId(null); setHorarioId(null); setDiaSelecionado(null)
      setCorId(null); setObservacoes(''); setComprovanteUrl(null); setComprovantePreview(null); setCorPreAplicada(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const uploadComprovante = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'proof')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no upload')
      return { url: data.url as string, path: data.path as string }
    },
    onSuccess: ({ url, path }) => {
      setComprovanteUrl(path)
      setComprovantePreview(url)
      toast.success('Comprovante enviado!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const servicoSel = servicos?.find((s) => s.id === servicoId)
  const horarioSel = horarios?.find((h) => h.id === horarioId)
  const corSel = cores?.find((c) => c.id === corId)
  const valorSinal = servicoSel && config ? servicoSel.preco * (config.percentualSinal / 100) : 0

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-serif font-bold">Agendar horário</h1>
        <div className="flex items-center gap-2 mt-3">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={cn('flex-1 h-1.5 rounded-full transition-colors', step >= s ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Passo {step} de 4 — {step === 1 ? 'Serviço' : step === 2 ? 'Horário' : step === 3 ? 'Detalhes' : 'Sinal & Comprovante'}
        </p>
      </div>

      {/* STEP 1 — Serviço */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Escolha o serviço</h2>
          {loadingServ ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
          ) : !servicos || servicos.length === 0 ? (
            <Card className="bg-card/50 border-dashed"><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhum serviço disponível no momento.</CardContent></Card>
          ) : (
            servicos.map((s) => (
              <button
                key={s.id}
                onClick={() => setServicoId(s.id)}
                className={cn(
                  'w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.98]',
                  servicoId === s.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border bg-card hover:border-primary/40'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-serif font-semibold">{s.nome}</p>
                    {s.descricao && <p className="text-xs text-muted-foreground mt-0.5">{s.descricao}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.duracaoMinutos} min</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">R$ {s.preco.toFixed(2).replace('.', ',')}</p>
                    {servicoId === s.id && <Check className="h-4 w-4 text-primary ml-auto mt-1" />}
                  </div>
                </div>
              </button>
            ))
          )}
          <Button className="w-full" disabled={!servicoId} onClick={() => setStep(2)}>
            Continuar <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* STEP 2 — Horário */}
      {step === 2 && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          <h2 className="text-sm font-semibold text-muted-foreground">Escolha o dia</h2>
          {loadingHor ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : diasDisponiveis.length === 0 ? (
            <Card className="bg-card/50 border-dashed"><CardContent className="p-6 text-center text-sm text-muted-foreground">Nenhum horário disponível.</CardContent></Card>
          ) : (
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              {diasDisponiveis.map((data) => {
                const d = parseData(data)
                const ativo = diaSelecionado === data
                const temLivre = horarios?.some((h) => h.data === data && h.status === 'livre')
                if (!temLivre) return null
                return (
                  <button
                    key={data}
                    onClick={() => { setDiaSelecionado(data); setHorarioId(null) }}
                    className={cn('shrink-0 w-16 py-3 rounded-2xl border text-center transition-all', ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
                  >
                    <p className="text-[11px] uppercase">{DIAS[d.getDay()]}</p>
                    <p className="text-xl font-bold">{d.getDate()}</p>
                  </button>
                )
              })}
            </div>
          )}
          {diaSelecionado && (
            <>
              <h2 className="text-sm font-semibold text-muted-foreground">Horários disponíveis</h2>
              {horariosDoDia.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem horários livres neste dia.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {horariosDoDia.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setHorarioId(h.id)}
                      className={cn('py-3 rounded-xl border font-medium text-sm transition-all active:scale-95', horarioId === h.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
                    >
                      {h.horaInicio}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <Button className="w-full" disabled={!horarioId} onClick={() => setStep(3)}>
            Continuar <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* STEP 3 — Cor & observações */}
      {step === 3 && (
        <div className="space-y-5">
          <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Serviço</span><span className="font-medium">{servicoSel?.nome}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Quando</span><span className="font-medium">{horarioSel ? `${formatDataCurta(horarioSel.data)} às ${horarioSel.horaInicio}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Valor</span><span className="font-bold text-primary">R$ {servicoSel?.preco.toFixed(2).replace('.', ',')}</span></div>
              {config?.exigeSinal && (
                <div className="flex justify-between"><span className="text-muted-foreground">Sinal ({config.percentualSinal}%)</span><span className="font-bold text-primary">R$ {valorSinal.toFixed(2).replace('.', ',')}</span></div>
              )}
            </CardContent>
          </Card>
          {cores && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Palette className="h-4 w-4" /> Cor do esmalte (opcional)</h2>
              {corSel && (
                <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-primary/10 border border-primary/30">
                  <span className="h-6 w-6 rounded-full border border-border" style={esmalteStyle(corSel.hex)} />
                  <span className="text-sm font-medium">{corSel.nome}</span>
                  <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => setCorId(null)}>Remover</Button>
                </div>
              )}
              <div className="grid grid-cols-6 gap-2.5 max-h-56 overflow-y-auto scrollbar-thin p-1">
                {cores.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCorId(c.id)}
                    title={c.nome}
                    className={cn('aspect-square rounded-full border-2 transition-all active:scale-90', corId === c.id ? 'border-primary ring-2 ring-primary/40 scale-110' : 'border-border')}
                    style={esmalteStyle(c.hex)}
                  />
                ))}
              </div>
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Tag className="h-4 w-4" /> Observações (opcional)</h2>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Ex: detalhes especiais, preferências..." rows={3} />
          </div>
          <Button className="w-full h-12 text-base font-semibold" onClick={() => setStep(4)}>
            Continuar <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* STEP 4 — Sinal & Comprovante */}
      {step === 4 && (
        <div className="space-y-5">
          <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>

          {/* Resumo do sinal */}
          {config?.exigeSinal && !user?.eClienteConfianca && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <p className="font-serif font-bold">Pagamento do sinal</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sinal ({config.percentualSinal}%)</span>
                    <span className="font-bold text-primary text-lg">R$ {valorSinal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Restante no atendimento</span>
                    <span className="font-medium">R$ {(servicoSel!.preco - valorSinal).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Chave Pix:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-background rounded-lg px-3 py-2 border border-border">
                      {config.chavePix || 'Não configurada'}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (config.chavePix) {
                          navigator.clipboard?.writeText(config.chavePix)
                          toast.success('Chave Pix copiada!')
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Envie o comprovante em até {config.prazoEnvioSinalHoras}h. Após aprovação da manicure, seu horário será confirmado.
                </p>
              </CardContent>
            </Card>
          )}

          {user?.eClienteConfianca && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-emerald-700 font-medium">
                  ✨ Você é uma cliente de confiança! O agendamento será confirmado automaticamente, sem necessidade de sinal.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Upload do comprovante */}
          {config?.exigeSinal && !user?.eClienteConfianca && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Comprovante do sinal</h2>
              {comprovantePreview ? (
                <Card className="border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={comprovantePreview} alt="Comprovante" className="h-20 w-20 rounded-lg object-cover border border-border" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                          <Check className="h-4 w-4" /> Comprovante anexado
                        </p>
                        <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs" onClick={() => { setComprovanteUrl(null); setComprovantePreview(null) }}>
                          Trocar imagem
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <label className="block">
                  <div className="border-1.5 border-dashed border-primary rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-primary/5 transition-colors">
                    <Upload className="h-8 w-8 text-primary" />
                    <p className="text-sm text-muted-foreground text-center">Toque para enviar a foto do comprovante</p>
                    <p className="text-[11px] text-muted-foreground/70">PNG, JPG ou WEBP</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadComprovante.mutate(file)
                    }}
                  />
                </label>
              )}
            </div>
          )}

          <Button
            className="w-full h-12 text-base font-semibold"
            disabled={submit.isPending || (config?.exigeSinal && !user?.eClienteConfianca && !comprovanteUrl)}
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? 'Enviando...' : user?.eClienteConfianca ? 'Confirmar agendamento' : 'Enviar solicitação com sinal'}
          </Button>
        </div>
      )}
    </div>
  )
}
