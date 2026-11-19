// Utilitários de feedback tátil e visual — Tainails
import type confettiType from 'canvas-confetti'

export function haptic(pattern: number | number[] = 10) {
  if (typeof window === 'undefined') return
  if ('vibrate' in navigator) {
    try { navigator.vibrate(pattern) } catch {}
  }
}

export const hapticTap = () => haptic(8)
export const hapticSuccess = () => haptic([10, 30, 10])
export const hapticError = () => haptic([20, 40, 20])
export const hapticSelect = () => haptic(5)

let confettiLib: typeof confettiType | null = null

async function loadConfetti(): Promise<typeof confettiType> {
  if (!confettiLib) {
    const mod = await import('canvas-confetti')
    // canvas-confetti usa `export =` (callable namespace).
    // Com esModuleInterop, o namespace dinâmico expõe a função em `mod.default`
    // e também como o próprio namespace em runtime.
    confettiLib = (mod as unknown as typeof confettiType)
  }
  return confettiLib
}

export async function confetti(opts?: { emojis?: string[]; colors?: string[] }) {
  try {
    const confettiFn = await loadConfetti()
    // Cores da paleta Tainails: dusty rose, light pink, warm beige, charcoal
    const colors = opts?.colors ?? ['#C94D68', '#F7A6B7', '#EED8DE', '#E8D3C0']
    const shapes = opts?.emojis ?? undefined

    confettiFn({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      ...(shapes ? { shapes: shapes.map((e) => confettiFn.shapeFromText(e)) } : {}),
      scalar: 0.9,
    })
    setTimeout(() => {
      confettiFn({ particleCount: 30, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors })
    }, 150)
    setTimeout(() => {
      confettiFn({ particleCount: 30, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors })
    }, 300)
  } catch {}
}
