'use client'

import { useRef, useState, type ReactNode } from 'react'
import { LayoutDashboard, CalendarClock, Star, Wallet, Images, Scissors, Settings, CalendarDays } from 'lucide-react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useAuthStore } from '@/components/auth-provider'
import { NotificationBell } from '@/components/notification-bell'
import { AvatarBubble } from '@/components/avatar-bubble'
import { ManicureProfileDialog } from '@/components/manicure-profile-dialog'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AdminPending } from '@/components/admin/admin-pending'
import { AdminTrustedClients } from '@/components/admin/admin-trusted-clients'
import { AdminCash } from '@/components/admin/admin-cash'
import { AdminGallery } from '@/components/admin/admin-gallery'
import { AdminServices } from '@/components/admin/admin-services'
import { AdminSettings } from '@/components/admin/admin-settings'
import { AdminSchedule } from '@/components/admin/admin-schedule'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { useNotificacoesNaoLidas } from '@/hooks/use-notificacoes-nao-lidas'
import { ScrollArea } from '@/components/ui/scroll-area'

type Tab = 'dashboard' | 'horarios' | 'pendentes' | 'confianca' | 'caixa' | 'galeria' | 'servicos' | 'config'

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Agenda', icon: LayoutDashboard },
  { id: 'horarios', label: 'Horários', icon: CalendarDays },
  { id: 'pendentes', label: 'Sinais', icon: CalendarClock },
  { id: 'confianca', label: 'Confiança', icon: Star },
  { id: 'caixa', label: 'Caixa', icon: Wallet },
  { id: 'galeria', label: 'Galeria', icon: Images },
  { id: 'servicos', label: 'Serviços', icon: Scissors },
  { id: 'config', label: 'Config', icon: Settings },
]

/* Personalidade de cada ícone ao toque (adaptado do CodePen de referência) */
const ICON_ANIM: Record<Tab, Record<string, number[]>> = {
  dashboard: { rotate: [0, -25, 25, 0] },               // sacode
  horarios: { rotateX: [0, -180, -360] },               // dá um giro (flip)
  pendentes: { rotate: [0, 30, -30, 0] },               // pêndulo
  confianca: { rotate: [0, 360], scale: [1, 1.3, 1] },  // estrela gira e pulsa
  caixa: { y: [0, -6, 0], scaleY: [1, 0.72, 1] },       // pula e amassa
  galeria: { x: [0, 4, -4, 0], rotate: [0, -8, 8, 0] }, // troca as fotos
  servicos: { rotate: [0, -22, 0], scale: [1, 1.2, 1] }, // tesourada
  config: { rotate: [0, 180] },                         // engrenagem meia-volta
}

function NavTab({
  t,
  ativo,
  onClick,
}: {
  t: { id: Tab; label: string; icon: typeof LayoutDashboard }
  ativo: boolean
  onClick: () => void
}) {
  const [seq, setSeq] = useState(0)
  const Icon = t.icon
  return (
    <li className="flex">
      <button
        onClick={() => {
          setSeq((s) => s + 1)
          onClick()
        }}
        className={cn(
          'w-full flex flex-col items-center gap-1 py-2.5 text-[9px] min-[380px]:text-[10px] font-medium transition-colors px-1 press',
          ativo ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <motion.span
          key={seq}
          initial={{ rotate: 0, rotateX: 0, scale: 1, x: 0, y: 0, scaleY: 1 }}
          animate={seq > 0 ? ICON_ANIM[t.id] : undefined}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          className="inline-flex"
        >
          <Icon className={cn('h-5 w-5 transition-transform', ativo && 'scale-110')} />
        </motion.span>
        <span className="truncate">{t.label}</span>
      </button>
    </li>
  )
}

export function ManicureApp() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('dashboard')
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

    // tilt do nav (adaptado do CodePen): aba da esquerda inclina p/ um lado,
    // da direita p/ outro, do centro recua — como se o nav cedesse ao toque
    const pos = (novo - (TABS.length - 1) / 2) / ((TABS.length - 1) / 2)
    navControls.start({
      rotateX: [0, (1 - Math.abs(pos)) * 6, 0],
      rotateY: [0, pos * 5, 0],
      transition: { duration: 0.6, ease: 'easeInOut' },
    })
    setTab(id)
  }

  const screens: Record<Tab, ReactNode> = {
    dashboard: <AdminDashboard />,
    horarios: <AdminSchedule />,
    pendentes: <AdminPending />,
    confianca: <AdminTrustedClients />,
    caixa: <AdminCash />,
    galeria: <AdminGallery />,
    servicos: <AdminServices />,
    config: <AdminSettings />,
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
              <p className="text-xs text-muted-foreground leading-none">Painel da manicure</p>
              <p className="text-sm font-semibold truncate leading-tight">{user.nome}</p>
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
        <ScrollArea className="w-full no-scrollbar">
          <ul className="grid grid-cols-8 min-w-full">
            {TABS.map((t) => (
              <NavTab key={t.id} t={t} ativo={tab === t.id} onClick={() => goTab(t.id)} />
            ))}
          </ul>
        </ScrollArea>
      </motion.nav>

      <ManicureProfileDialog open={perfilOpen} onOpenChange={setPerfilOpen} />
    </div>
  )
}
