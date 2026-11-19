'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Settings, Save, AlertCircle, Bell, Volume2, Vibrate } from 'lucide-react'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { REPOSICAO_UNHA_VALOR } from '@/lib/constants'
import { hapticTap, hapticSuccess } from '@/lib/feedback'

interface Configuracoes {
  id: string
  exigeSinal: boolean
  percentualSinal: number
  prazoEnvioSinalHoras: number
  chavePix: string | null
  politicaCancelamentoHoras: number
}

export function AdminSettings() {
  const qc = useQueryClient()
  const [form, setForm] = useState<Partial<Configuracoes>>({
    exigeSinal: true,
    percentualSinal: 50,
    prazoEnvioSinalHoras: 4,
    chavePix: '',
    politicaCancelamentoHoras: 4,
  })

  const [notifPrefs, setNotifPrefs] = useState({
    agendamentos: true,
    sinais: true,
    lembretes: true,
    som: true,
    vibrar: true,
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tainails:notif-prefs')
      if (raw) setNotifPrefs({ agendamentos: true, sinais: true, lembretes: true, som: true, vibrar: true, ...JSON.parse(raw) })
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('tainails:notif-prefs', JSON.stringify(notifPrefs))
    } catch {}
  }, [notifPrefs])

  const { data: config, isLoading } = useQuery<Configuracoes>({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const res = await fetch('/api/configuracoes', { credentials: 'include' })
      const j = await res.json()
      return j.configuracoes
    },
  })

  useEffect(() => {
    if (config) {
      setForm({
        exigeSinal: config.exigeSinal,
        percentualSinal: config.percentualSinal,
        prazoEnvioSinalHoras: config.prazoEnvioSinalHoras,
        chavePix: config.chavePix || '',
        politicaCancelamentoHoras: config.politicaCancelamentoHoras,
      })
    }
  }, [config])

  const salvar = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/configuracoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      return d
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['configuracoes'] })
      toast.success('Configurações salvas!')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) {
    return <div className="p-4"><div className="h-40 w-full rounded-2xl shimmer" /></div>
  }

  return (
    <div className="p-4 space-y-5">
      <div>
        <h1 className="text-xl font-serif font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Regras do seu negócio</p>
      </div>

      {/* Sinal */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif font-semibold">Exigir sinal</p>
              <p className="text-xs text-muted-foreground">Obrigatório para agendar</p>
            </div>
            <Switch
              checked={form.exigeSinal}
              onCheckedChange={(v) => setForm({ ...form, exigeSinal: v })}
            />
          </div>

          {form.exigeSinal && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Percentual do sinal</Label>
                  <span className="font-bold text-primary">{form.percentualSinal}%</span>
                </div>
                <Slider
                  value={[form.percentualSinal || 50]}
                  onValueChange={([v]) => setForm({ ...form, percentualSinal: v })}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Prazo para envio do comprovante</Label>
                <div className="flex gap-2">
                  {[2, 4, 8, 24].map((h) => (
                    <button
                      key={h}
                      onClick={() => setForm({ ...form, prazoEnvioSinalHoras: h })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${(form.prazoEnvioSinalHoras || 4) === h ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix">Chave Pix</Label>
                <Input
                  id="pix"
                  value={form.chavePix || ''}
                  onChange={(e) => setForm({ ...form, chavePix: e.target.value })}
                  placeholder="(55) 21 959416542"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancelamento */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-2">
          <p className="font-serif font-semibold">Cancelamento gratuito</p>
          <p className="text-xs text-muted-foreground mb-3">Até quantas horas antes do horário?</p>
          <div className="flex gap-2">
            {[2, 4, 8, 24].map((h) => (
              <button
                key={h}
                onClick={() => setForm({ ...form, politicaCancelamentoHoras: h })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${(form.politicaCancelamentoHoras || 4) === h ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                {h}h
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regras adicionais */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-2">
          <p className="font-serif font-semibold">Regras adicionais</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Reposição de unha quebrada: <span className="text-primary font-medium">R$ {REPOSICAO_UNHA_VALOR.toFixed(2).replace('.', ',')}</span></p>
            <p>• Pagamento restante no atendimento (não aceita fiado)</p>
            <p>• Não comparecimento ou atraso superior a 15min sem aviso: sinal não é devolvido</p>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <p className="font-serif font-semibold">Notificações</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quais tipos você quer receber?</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="np-agendamentos" className="text-sm leading-tight">Agendamentos (confirmações, recusas, cancelamentos)</Label>
                <Switch
                  id="np-agendamentos"
                  checked={notifPrefs.agendamentos}
                  onCheckedChange={(v) => { hapticTap(); setNotifPrefs({ ...notifPrefs, agendamentos: v }) }}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="np-sinais" className="text-sm leading-tight">Sinais (aprovação, rejeição, expiração)</Label>
                <Switch
                  id="np-sinais"
                  checked={notifPrefs.sinais}
                  onCheckedChange={(v) => { hapticTap(); setNotifPrefs({ ...notifPrefs, sinais: v }) }}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="np-lembretes" className="text-sm leading-tight">Lembretes de atendimento</Label>
                <Switch
                  id="np-lembretes"
                  checked={notifPrefs.lembretes}
                  onCheckedChange={(v) => { hapticTap(); setNotifPrefs({ ...notifPrefs, lembretes: v }) }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Como ser avisado?</p>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="np-som" className="text-sm flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" /> Som ao receber
              </Label>
              <Switch
                id="np-som"
                checked={notifPrefs.som}
                onCheckedChange={(v) => {
                  setNotifPrefs({ ...notifPrefs, som: v })
                  if (v) {
                    try {
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
                      const osc = ctx.createOscillator()
                      const gain = ctx.createGain()
                      osc.connect(gain)
                      gain.connect(ctx.destination)
                      osc.type = 'sine'
                      osc.frequency.setValueAtTime(880, ctx.currentTime)
                      osc.frequency.setValueAtTime(1318, ctx.currentTime + 0.08)
                      gain.gain.setValueAtTime(0, ctx.currentTime)
                      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01)
                      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
                      osc.start()
                      osc.stop(ctx.currentTime + 0.3)
                    } catch {}
                  } else {
                    hapticTap()
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="np-vibrar" className="text-sm flex items-center gap-2">
                <Vibrate className="h-4 w-4 text-muted-foreground" /> Vibrar ao receber
              </Label>
              <Switch
                id="np-vibrar"
                checked={notifPrefs.vibrar}
                onCheckedChange={(v) => {
                  setNotifPrefs({ ...notifPrefs, vibrar: v })
                  if (v) hapticSuccess()
                  else hapticTap()
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-12 font-semibold" onClick={() => salvar.mutate()} disabled={salvar.isPending}>
        <Save className="h-4 w-4 mr-2" /> {salvar.isPending ? 'Salvando...' : 'Salvar configurações'}
      </Button>
    </div>
  )
}
