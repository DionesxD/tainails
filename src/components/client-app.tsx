'use client'

import { useRef, useState, type ReactNode } from 'react'
import { Home, CalendarDays, Palette, History } from 'lucide-react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useAuthStore } from '@/components/auth-provider'
import { NotificationBell } from '@/components/notification-bell'
import { AvatarBubble } from '@/components/avatar-bubble'
import { ClientHome } from '@/components/client/client-home'
import { ClientBooking } from '@/components/client/client-booking'
import { ClientColorTester } from '@/components/client/client-color-tester'
import { ClientAppointments } from '@/components/client/client-appointments'
import { ClientProfileDialog } from '@/components/client/client-profile-dialog'
import { cn } from '@/lib/utils'
import { useNotificacoesNaoLidas } from '@/hooks/use-notificacoes-nao-lidas'
import { ThemeToggle } from '@/components/theme-toggle'

type Tab = 'home' | 'agendar' | 'provador' | 'agendamentos'

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'agendar', label: 'Agendar', icon: CalendarDays },
  { id: 'provador', label: 'Provador', icon: Palette },
  { id: 'agendamentos', label: 'Meus', icon: History },
]

/* Personalidade de cada ícone ao toque (adaptado do CodePen de referência) */
const ICON_ANIM: Record<Tab, Record<string, number[]>> = {
  home: { y: [0, -6, 0], scaleY: [1, 0.75, 1] },        // pula e amassa
  agendar: { rotateX: [0, -360] },                       // dá um giro (flip)
  provador: { rotate: [0, -25, 25, 0], x: [0, 3, -3, 0] }, // balança a paleta
  agendamentos: { rotate: [0, 30, -30, 0] },             // pêndulo
}

function NavTab({
  t,
  ativo,
  onClick,
}: {
  t: { id: Tab; label: string; icon: typeof Home }
  ativo: boolean
  onClick: () => void
}) {
  const [seq, setSeq] = useState(0)
  const Icon = t.icon
  return (
    <li>
      <button
        onClick={() => {
          setSeq((s) => s + 1)
          onClick()
        }}
        className={cn(
          'w-full flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors press',
          ativo ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <motion.span
          animate={ativo ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="relative"
        >
          <motion.span
            key={seq}
            initial={{ rotate: 0, rotateX: 0, x: 0, y: 0, scaleY: 1 }}
            animate={seq > 0 ? ICON_ANIM[t.id] : undefined}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <Icon className="h-5 w-5" />
          </motion.span>
          {ativo && (
            <motion.span
              layoutId="nav-dot-client"
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
          )}
        </motion.span>
        {t.label}
      </button>
    </li>
  )
}

export function ClientApp() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('home')
  const [perfilOpen, setPerfilOpen] = useState(false)
  const naoLidas = useNotificacoesNaoLidas()
  const dirRef = useRef(1)
  const navControls = useAnimationControls()

  if (!user) return null

  // troca de aba: direção do slide + tilt 3D do nav em direção ao toque
  const goTab = (id: Tab) => {
    const atual = TABS.findIndex((t) => t.id === tab)
    const novo = TABS.findIndex((t) => t.id === id)
    if (novo === atual) return
    dirRef.current = novo > atual ? 1 : -1
    window.scrollTo(0, 0)  // a nova view começa do topo

    // tilt do nav (adaptado do CodePen): cede ao toque na direção da aba
    const pos = (novo - (TABS.length - 1) / 2) / ((TABS.length - 1) / 2)
    navControls.start({
      rotateX: [0, (1 - Math.abs(pos)) * 6, 0],
      rotateY: [0, pos * 5, 0],
      transition: { duration: 0.6, ease: 'easeInOut' },
    })
    setTab(id)
  }

  const screens: Record<Tab, ReactNode> = {
    home: <ClientHome onAgendar={() => goTab('agendar')} onProvador={() => goTab('provador')} />,
    agendar: <ClientBooking />,
    provador: <ClientColorTester />,
    agendamentos: <ClientAppointments onAgendar={() => goTab('agendar')} />,
  }

  return (
    <div className="min-h-screen md:min-h-[92vh] md:my-6 flex flex-col bg-card/12 dark:bg-card/55 max-w-md mx-auto w-full md:rounded-[2.5rem] md:border md:border-border/80 md:shadow-2xl md:shadow-primary/10 relative z-10 transition-colors">
      <header className="sticky top-3 z-30 mx-3 mt-3 rounded-2xl glass-bar border border-white/50 dark:border-white/10 shadow-lg shadow-primary/5">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setPerfilOpen(true)} className="flex items-center gap-2.5 min-w-0 group">
            {user.fotoUrl ? (
              <img src={`${user.fotoUrl}?t=${Date.now()}`} alt={user.nome} className={cn('h-9 w-9 rounded-full object-cover border border-border group-active:scale-95 transition-transform', naoLidas > 0 && 'pulse-ring')} />
            ) : (
              <AvatarBubble nome={user.nome} size="sm" className={cn('group-active:scale-95 transition-transform', naoLidas > 0 && 'pulse-ring')} />
            )}
            <div className="min-w-0 text-left">
              <p className="text-xs text-muted-foreground leading-none">Olá,</p>
              <p className="text-sm font-semibold truncate leading-tight">{user.nome.split(' ')[0]}</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <ThemeToggle className="h-9 w-9" />
            <NotificationBell />
          </div>
        </div>
      </header>

      <main className="relative flex-1 pb-24">
        {/* mode="wait": a view antiga sai ANTES da nova entrar — sem
            sobreposição, sem colapso de altura, sem voar por cima do header.
            Entrada com mola subamortecida = bounce */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 26 * dirRef.current, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              x: -14 * dirRef.current,
              y: -10,
              scale: 0.98,
              transition: { duration: 0.14, ease: 'easeIn' },
            }}
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 20 },
              y: { type: 'spring', stiffness: 300, damping: 20 },
              scale: { type: 'spring', stiffness: 300, damping: 22 },
              opacity: { duration: 0.18, ease: 'easeOut' },
            }}
          >
            {screens[tab]}
          </motion.div>
        </AnimatePresence>
      </main>

      <motion.nav
        animate={navControls}
        initial={{ rotateX: 0, rotateY: 0 }}
        style={{ transformOrigin: '50% 133%', transformPerspective: 900 }}
        className="sticky bottom-3 z-40 mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] rounded-2xl glass-bar border border-white/50 dark:border-white/10 shadow-xl shadow-primary/10"
      >
        <ul className="grid grid-cols-4">
          {TABS.map((t) => (
            <NavTab key={t.id} t={t} ativo={tab === t.id} onClick={() => goTab(t.id)} />
          ))}
        </ul>
      </motion.nav>

      <ClientProfileDialog open={perfilOpen} onOpenChange={setPerfilOpen} />
    </div>
  )
}
