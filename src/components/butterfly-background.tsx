'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================
// ButterflyBackground v6 — Tainails "Jardim das Borboletas"
// Arquitetura HTML com dobradiça física nas asas:
// Asa esquerda ancorada na borda direita (100% 50%)
// Asa direita ancorada na borda esquerda (0% 50%)
// Corpo central posicionado sobre o eixo de união (50%)
// IMPOSSÍVEL DESCOLAR: travamento garantido pelo CSS Box Model.
// ============================================================

interface ButterflySpecies {
  name: string
  wingColorA: string
  wingColorB: string
  accent: string
  bodyColor: string
}

const SPECIES: ButterflySpecies[] = [
  {
    name: 'RoseSuave',
    wingColorA: '#FFD6DE',
    wingColorB: '#C94D68',
    accent: '#7D2E45',
    bodyColor: '#361822',
  },
  {
    name: 'ChampagneDourada',
    wingColorA: '#FFF5D6',
    wingColorB: '#DEAA43',
    accent: '#8C5B00',
    bodyColor: '#38260D',
  },
  {
    name: 'PerolaAlabastro',
    wingColorA: '#FFFFFF',
    wingColorB: '#D8C4CC',
    accent: '#7D5C67',
    bodyColor: '#2B1C22',
  },
  {
    name: 'LavandaSuave',
    wingColorA: '#F3E8FF',
    wingColorB: '#B388B8',
    accent: '#65336B',
    bodyColor: '#28152B',
  },
]

const PETAL_COLORS = ['#FAD1DA', '#FFE4E9', '#F7C6D0', '#F2D9B8', '#F5EDE0']

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface ButterflyConfig {
  id: number
  size: number
  species: ButterflySpecies
  flightDuration: number
  flightDelay: number
  flapSpeed: number
  startX: number
  startY: number
  waypoints: { x: number; y: number; rotate: number }[]
}

function ButterflyPhysicallyAnchored({
  size,
  species,
  flightDuration,
  flightDelay,
  flapSpeed,
  startX,
  startY,
  waypoints,
}: ButterflyConfig) {
  const allPoints = [
    { x: startX, y: startY, rotate: 0 },
    ...waypoints,
    { x: startX, y: startY, rotate: 0 },
  ]
  const xK = allPoints.map((p) => p.x)
  const yK = allPoints.map((p) => p.y)
  const rK = allPoints.map((p) => p.rotate)

  const gradLeftId = `bf-l-${species.name}-${startX.toFixed(0)}-${startY.toFixed(0)}`
  const gradRightId = `bf-r-${species.name}-${startX.toFixed(0)}-${startY.toFixed(0)}`

  return (
    <motion.div
      className="absolute pointer-events-none will-change-transform"
      style={{
        width: size,
        height: size,
        left: 0,
        top: 0,
        filter: 'drop-shadow(0 2px 5px rgba(50, 20, 30, 0.16))',
      }}
      initial={{ x: `${startX}vw`, y: `${startY}vh`, rotate: 0 }}
      animate={{
        x: xK.map((v) => `${v}vw`),
        y: yK.map((v) => `${v}vh`),
        rotate: rK,
      }}
      transition={{
        duration: flightDuration,
        delay: flightDelay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Contêiner da borboleta com leve flutuação vertical no voo */}
      <motion.div
        className="relative w-full h-full flex items-center justify-center"
        animate={{ y: [0, -2.5, 0] }}
        transition={{ duration: flapSpeed, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* ========================================================
            ASA ESQUERDA:
            Ocupa a metade esquerda (w-1/2, left-0).
            Dobradiça em 100% 50% (borda direita da div).
            NUNCA se separa da linha central (50%).
            ======================================================== */}
        <motion.div
          className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-end will-change-transform"
          style={{ transformOrigin: '100% 50%' }}
          animate={{ scaleX: [1, 0.18, 0.95, 0.18, 1, 0.9, 1] }}
          transition={{
            duration: flapSpeed * 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg viewBox="0 0 50 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={gradLeftId} x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor={species.wingColorA} stopOpacity="0.95" />
                <stop offset="100%" stopColor={species.wingColorB} stopOpacity="0.85" />
              </linearGradient>
            </defs>

            {/* Asa Superior Esquerda — base termina exatamente em X=50 */}
            <path
              d="M 50 48 C 36 16, 12 20, 6 40 C 0 60, 14 74, 26 72 C 36 68, 46 58, 50 50 Z"
              fill={`url(#${gradLeftId})`}
              stroke={species.accent}
              strokeWidth="0.75"
              strokeOpacity="0.6"
            />
            {/* Detalhes rendados internos */}
            <path
              d="M 50 48 Q 30 42, 16 36 M 50 48 Q 26 52, 18 60 M 50 48 Q 34 64, 26 70"
              stroke={species.accent}
              strokeWidth="0.45"
              strokeOpacity="0.35"
              fill="none"
            />
            <ellipse cx="22" cy="42" rx="4" ry="6" fill={species.accent} opacity={0.45} />
            <circle cx="14" cy="54" r="2" fill={species.accent} opacity={0.4} />
            <circle cx="28" cy="30" r="1.5" fill="#FFFFFF" opacity={0.75} />

            {/* Asa Inferior Esquerda — base termina exatamente em X=50 */}
            <path
              d="M 50 52 C 40 64, 28 78, 26 88 C 34 92, 44 86, 48 76 C 50 68, 50 58, 50 52 Z"
              fill={`url(#${gradLeftId})`}
              stroke={species.accent}
              strokeWidth="0.6"
              strokeOpacity="0.5"
            />
            <ellipse cx="34" cy="80" rx="2.5" ry="3.5" fill={species.accent} opacity={0.4} />
            <circle cx="28" cy="86" r="1.5" fill="#FFFFFF" opacity={0.65} />
          </svg>
        </motion.div>

        {/* ========================================================
            ASA DIREITA:
            Ocupa a metade direita (w-1/2, right-0).
            Dobradiça em 0% 50% (borda esquerda da div).
            NUNCA se separa da linha central (50%).
            ======================================================== */}
        <motion.div
          className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-start will-change-transform"
          style={{ transformOrigin: '0% 50%' }}
          animate={{ scaleX: [1, 0.18, 0.95, 0.18, 1, 0.9, 1] }}
          transition={{
            duration: flapSpeed * 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg viewBox="50 0 50 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={gradRightId} x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor={species.wingColorA} stopOpacity="0.95" />
                <stop offset="100%" stopColor={species.wingColorB} stopOpacity="0.85" />
              </linearGradient>
            </defs>

            {/* Asa Superior Direita — base começa exatamente em X=50 */}
            <path
              d="M 50 48 C 64 16, 88 20, 94 40 C 100 60, 86 74, 74 72 C 64 68, 54 58, 50 50 Z"
              fill={`url(#${gradRightId})`}
              stroke={species.accent}
              strokeWidth="0.75"
              strokeOpacity="0.6"
            />
            {/* Detalhes rendados internos */}
            <path
              d="M 50 48 Q 70 42, 84 36 M 50 48 Q 74 52, 82 60 M 50 48 Q 66 64, 74 70"
              stroke={species.accent}
              strokeWidth="0.45"
              strokeOpacity="0.35"
              fill="none"
            />
            <ellipse cx="78" cy="42" rx="4" ry="6" fill={species.accent} opacity={0.45} />
            <circle cx="86" cy="54" r="2" fill={species.accent} opacity={0.4} />
            <circle cx="72" cy="30" r="1.5" fill="#FFFFFF" opacity={0.75} />

            {/* Asa Inferior Direita — base começa exatamente em X=50 */}
            <path
              d="M 50 52 C 60 64, 72 78, 74 88 C 66 92, 56 86, 52 76 C 50 68, 50 58, 50 52 Z"
              fill={`url(#${gradRightId})`}
              stroke={species.accent}
              strokeWidth="0.6"
              strokeOpacity="0.5"
            />
            <ellipse cx="66" cy="80" rx="2.5" ry="3.5" fill={species.accent} opacity={0.4} />
            <circle cx="72" cy="86" r="1.5" fill="#FFFFFF" opacity={0.65} />
          </svg>
        </motion.div>

        {/* ========================================================
            CORPO CENTRAL E ANTENAS:
            Centralizado com z-10 sobre a junção das duas asas.
            Cobre qualquer emenda milimétrica com perfeição.
            ======================================================== */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {/* Corpo */}
            <ellipse cx="50" cy="50" rx="2.8" ry="19" fill={species.bodyColor} />
            <circle cx="50" cy="32" r="3.4" fill={species.bodyColor} />

            {/* Antenas delicadas */}
            <path
              d="M 49 30 Q 42 20, 35 14"
              stroke={species.bodyColor}
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 51 30 Q 58 20, 65 14"
              stroke={species.bodyColor}
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="35" cy="14" r="1.4" fill={species.accent} />
            <circle cx="65" cy="14" r="1.4" fill={species.accent} />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface SparkleConfig {
  id: number
  size: number
  color: string
  duration: number
  delay: number
  x: number
  y: number
}

function Sparkle({ size, color, duration, delay, x, y }: SparkleConfig) {
  return (
    <motion.div
      className="absolute pointer-events-none will-change-transform"
      style={{ left: `${x}vw`, top: `${y}vh`, width: size, height: size }}
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{ opacity: [0, 0.75, 0], scale: [0, 1.2, 0], rotate: [0, 90, 180] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path d="M12 0 L13.5 9 L24 12 L13.5 15 L12 24 L10.5 15 L0 12 L10.5 9 Z" fill={color} />
      </svg>
    </motion.div>
  )
}

interface PetalConfig {
  id: number
  size: number
  color: string
  duration: number
  delay: number
  startX: number
  drift: number
}

function Petal({ size, color, duration, delay, startX, drift }: PetalConfig) {
  return (
    <motion.div
      className="absolute pointer-events-none will-change-transform"
      style={{ width: size, height: size, left: 0, top: 0 }}
      initial={{ x: `${startX}vw`, y: '-5vh', rotate: 0, opacity: 0 }}
      animate={{
        x: [`${startX}vw`, `${startX + drift}vw`, `${startX}vw`],
        y: ['-5vh', '105vh'],
        rotate: [0, 180, 360],
        opacity: [0, 0.55, 0.55, 0],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path d="M12 2 C 16 6, 18 12, 12 22 C 6 12, 8 6, 12 2 Z" fill={color} opacity={0.55} />
        <ellipse cx="12" cy="9" rx="2" ry="3" fill="#FFFFFF" opacity={0.35} />
      </svg>
    </motion.div>
  )
}

interface InteractiveDust {
  id: number
  x: number
  y: number
}

export interface ButterflyBackgroundProps {
  className?: string
  density?: 'low' | 'medium' | 'high'
  withPetals?: boolean
}

export function ButterflyBackground({
  className = '',
  density = 'medium',
  withPetals = true,
}: ButterflyBackgroundProps) {
  const [dustParticles, setDustParticles] = useState<InteractiveDust[]>([])

  // Interatividade suave: poeira estelar cintilante ao tocar ou mover o mouse
  useEffect(() => {
    let lastTime = 0
    let counter = 0

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const now = Date.now()
      if (now - lastTime < 75) return
      lastTime = now

      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY
      if (clientX === undefined || clientY === undefined) return

      const newDust: InteractiveDust = {
        id: ++counter,
        x: clientX,
        y: clientY,
      }

      setDustParticles((prev) => [...prev.slice(-12), newDust])
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    window.addEventListener('touchmove', handlePointerMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('touchmove', handlePointerMove)
    }
  }, [])

  const counts = {
    low: { butterflies: 4, sparkles: 8, petals: 6 },
    medium: { butterflies: 6, sparkles: 12, petals: 8 },
    high: { butterflies: 9, sparkles: 16, petals: 12 },
  }[density]

  const butterflies = useMemo<ButterflyConfig[]>(() => {
    return Array.from({ length: counts.butterflies }).map((_, i) => {
      const startX = rand(5, 90)
      const startY = rand(10, 80)
      const numWaypoints = 3 + Math.floor(Math.random() * 2)
      const waypoints = Array.from({ length: numWaypoints }).map((_, j) => {
        const direction = j % 2 === 0 ? 1 : -1
        return {
          x: Math.max(3, Math.min(94, startX + direction * rand(14, 28))),
          y: Math.max(6, Math.min(88, startY + rand(-20, 20))),
          rotate: direction * rand(8, 20),
        }
      })
      return {
        id: i,
        size: rand(34, 46), // Proporção elegante e delicada
        species: pick(SPECIES),
        flightDuration: rand(24, 40),
        flightDelay: rand(0, 5),
        flapSpeed: rand(0.38, 0.52),
        startX,
        startY,
        waypoints,
      }
    })
  }, [counts.butterflies])

  const sparkles = useMemo<SparkleConfig[]>(() => {
    const sparkColors = ['#F7A6B7', '#F6CF65', '#FFF5D6', '#EED8DE', '#D8BFD8']
    return Array.from({ length: counts.sparkles }).map((_, i) => ({
      id: i,
      size: rand(8, 14),
      color: pick(sparkColors),
      duration: rand(2.5, 4.5),
      delay: rand(0, 3),
      x: rand(3, 96),
      y: rand(3, 96),
    }))
  }, [counts.sparkles])

  const petals = useMemo<PetalConfig[]>(() => {
    return Array.from({ length: counts.petals }).map((_, i) => ({
      id: i,
      size: rand(12, 20),
      color: pick(PETAL_COLORS),
      duration: rand(15, 24),
      delay: rand(0, 8),
      startX: rand(0, 100),
      drift: rand(-12, 12),
    }))
  }, [counts.petals])

  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden select-none ${className}`}
      aria-hidden
    >
      {/* Floresta de sakura — amanhecer pastel (light) / noite de veludo (dark).
          Zoom lento estilo Ken Burns dá vida à cena sem distrair. */}
      <motion.div
        className="absolute inset-0 bg-sakura pointer-events-none will-change-transform"
        initial={{ scale: 1.02 }}
        animate={{ scale: [1.02, 1.08, 1.02] }}
        transition={{ duration: 90, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Véu de legibilidade: quase nada no claro (a floresta rica aparece
          através do vidro); mais presente no escuro p/ profundidade */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/30 via-background/10 to-background/35 dark:from-background/85 dark:via-background/60 dark:to-background/80" />

      {/* Pétalas flutuantes */}
      {withPetals && petals.map((p) => <Petal key={`pt-${p.id}`} {...p} />)}

      {/* Partículas de brilho / vaga-lumes */}
      {sparkles.map((s) => (
        <Sparkle key={`sp-${s.id}`} {...s} />
      ))}

      {/* Borboletas com asas fisicamente ancoradas */}
      {butterflies.map((b) => (
        <ButterflyPhysicallyAnchored key={`bf-${b.id}`} {...b} />
      ))}

      {/* Rastro interativo ao passar o mouse / tocar */}
      <AnimatePresence>
        {dustParticles.map((d) => (
          <motion.div
            key={`dust-${d.id}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: d.x,
              top: d.y,
              width: 9,
              height: 9,
              background: 'radial-gradient(circle, #FFF5D6 0%, #F7A6B7 70%, transparent 100%)',
              boxShadow: '0 0 8px rgba(247, 166, 183, 0.7), 0 0 3px #FFF5D6',
            }}
            initial={{ scale: 0.2, opacity: 1, x: '-50%', y: '-50%' }}
            animate={{
              scale: [0.2, 1.3, 0],
              opacity: [1, 0.7, 0],
              y: '-70%',
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
