'use client'

import { iniciais } from '@/lib/format'
import { cn } from '@/lib/utils'

// Paleta de avatares alinhada à identidade Tainails
const COLORS = ['#F7A6B7', '#EED8DE', '#E8D3C0', '#D985A0', '#C2A4AE']

export function AvatarBubble({ nome, size = 'sm', className }: { nome: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = iniciais(nome)
  const colorIdx = nome.charCodeAt(0) % COLORS.length
  const bg = COLORS[colorIdx]

  const sizes = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
  }

  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-semibold text-white shrink-0', sizes[size], className)}
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  )
}
