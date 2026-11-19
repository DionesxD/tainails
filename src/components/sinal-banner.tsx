'use client'

import { AlertCircle, Clock, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SinalBannerProps {
  valorSinal: number
  expiraEm: string | null
  agendamentoId: string
  chavePix?: string | null
}

export function SinalBanner({ valorSinal, expiraEm, agendamentoId, chavePix }: SinalBannerProps) {
  const expirado = expiraEm ? new Date(expiraEm) < new Date() : false

  const copiarPix = () => {
    if (!chavePix) {
      toast.error('Chave Pix não configurada pela manicure')
      return
    }
    navigator.clipboard?.writeText(chavePix)
    toast.success('Chave Pix copiada!')
  }

  return (
    <div className={cn(
      'mt-3 p-3 rounded-2xl border flex items-start gap-2',
      expirado
        ? 'bg-destructive/10 border-destructive/30'
        : 'bg-accent/20 border-primary/30'
    )}>
      <AlertCircle className={cn('h-4 w-4 shrink-0 mt-0.5', expirado ? 'text-destructive' : 'text-primary')} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">
          {expirado ? 'Sinal expirado' : 'Sinal pendente'}
        </p>
        <p className="text-lg font-serif font-bold text-primary tabular-nums">
          R$ {valorSinal.toFixed(2).replace('.', ',')}
        </p>
        {!expirado && expiraEm && (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            Expira em {new Date(expiraEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {!expirado && (
          <button
            onClick={copiarPix}
            className="mt-1.5 text-[11px] text-primary hover:underline flex items-center gap-1"
          >
            <Copy className="h-3 w-3" /> Copiar chave Pix
          </button>
        )}
      </div>
    </div>
  )
}
