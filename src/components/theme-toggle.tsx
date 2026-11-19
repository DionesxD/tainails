'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> }
}

const springIcon = { type: 'spring', stiffness: 380, damping: 22 } as const

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? 'light' : 'dark'
    const root = document.documentElement

    // origem do wipe circular: centro do botão
    const r = e.currentTarget.getBoundingClientRect()
    root.style.setProperty('--theme-x', `${Math.round(r.left + r.width / 2)}px`)
    root.style.setProperty('--theme-y', `${Math.round(r.top + r.height / 2)}px`)

    const doc = document as VTDocument
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (typeof doc.startViewTransition !== 'function' || reduced) {
      setTheme(next)
      return
    }

    // o wipe revela o novo tema; a dança do ícone acontece DEPOIS,
    // quando o DOM vivo volta à tela (durante o VT ele fica oculto)
    const vt = doc.startViewTransition(() => {
      root.classList.toggle('dark', next === 'dark')
      root.style.colorScheme = next
    })
    vt.finished.finally(() => setTheme(next))
  }

  return (
    <button
      type="button"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo noturno'}
      onClick={toggle}
      className={cn(
        'relative inline-flex items-center justify-center press',
        'h-10 w-10 rounded-full',
        'border border-border bg-card/80 backdrop-blur',
        'text-foreground hover:text-primary',
        'transition-all hover:scale-105 active:scale-95',
        'shadow-sm hover:shadow-md hover:shadow-primary/10',
        className
      )}
    >
      {mounted ? (
        <>
          {/* anel de pulso a cada troca */}
          <motion.span
            key={isDark ? 'pulse-dark' : 'pulse-light'}
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-primary/50 pointer-events-none"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          {/* dois ícones sempre montados — crossfade à prova de falha:
              um deles está SEMPRE em opacity 1, sem depender de exit */}
          <motion.span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
            animate={
              isDark
                ? { rotate: 0, scale: 1, opacity: 1, y: 0 }
                : { rotate: 120, scale: 0.4, opacity: 0, y: -10 }
            }
            transition={springIcon}
          >
            <Sun style={{ width: 18, height: 18 }} />
          </motion.span>
          <motion.span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
            animate={
              isDark
                ? { rotate: -120, scale: 0.4, opacity: 0, y: 10 }
                : { rotate: 0, scale: 1, opacity: 1, y: 0 }
            }
            transition={springIcon}
          >
            <Moon style={{ width: 18, height: 18 }} />
          </motion.span>
        </>
      ) : (
        <div style={{ width: 18, height: 18 }} />
      )}
    </button>
  )
}
