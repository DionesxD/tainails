'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TrackImage {
  id: string
  url: string
  alt?: string | null
}

interface ImageTrackProps {
  images: TrackImage[]
  /** altura do palco em px (default 300) */
  height?: number
  /** clique (sem arrasto) numa imagem — abre o lightbox, por ex. */
  onImageClick?: (index: number) => void
  className?: string
}

/**
 * Trilho de imagens arrastável (adaptado do CodePen "image track").
 *
 * Diferenças pro original: o range do arrasto é proporcional ao tamanho real
 * do trilho (funciona com 2 ou 20 fotos), o toque não bloqueia o scroll
 * vertical da página e o clique é distinguido do arrasto.
 * Mantidos: cálculo percentual inspirado no exemplo e parallax interno via
 * object-position. Um único loop de animação acompanha o alvo sem reiniciar
 * uma transição a cada movimento do ponteiro.
 */
export function ImageTrack({ images, height = 300, onImageClick, className }: ImageTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const downX = useRef(0)
  const prevPx = useRef(0)
  const currentPx = useRef(0)
  const targetPx = useRef(0)
  const frame = useRef<number | null>(null)
  const moved = useRef(0)
  const [dragging, setDragging] = useState(false)

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
  }, [])

  const getMaxScroll = () => {
    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return 1
    const images = track.querySelectorAll<HTMLImageElement>('.image-track__img')
    const firstImage = images[0]
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0
    const stepPx = firstImage ? firstImage.getBoundingClientRect().width + gap : 0
    const lastCardPosition = Math.max(0, images.length - 1) * stepPx
    // Mantém o passo do último cartão alinhado ao mesmo ritmo das setas.
    return Math.max(1, track.scrollWidth - container.clientWidth / 2, lastCardPosition)
  }

  // Um único loop acompanha o alvo do arrasto. Reiniciar uma animação de 3s
  // em cada pointermove fazia o trilho perseguir o cursor e acumular atraso.
  const animateToTarget = () => {
    if (frame.current !== null) return

    const track = trackRef.current
    if (!track) return

    const paint = (px: number) => {
      track.style.transform = `translate3d(${px}px, -50%, 0)`
      const maxScroll = getMaxScroll()
      const parallax = 100 + (px / maxScroll) * 100
      track.querySelectorAll<HTMLImageElement>('.image-track__img').forEach((img) => {
        img.style.objectPosition = `${parallax}% center`
      })
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentPx.current = targetPx.current
      paint(currentPx.current)
      return
    }

    let lastTime: number | null = null
    const tick = (time: number) => {
      const elapsed = lastTime === null ? 16 : Math.min(32, time - lastTime)
      lastTime = time
      const delta = targetPx.current - currentPx.current
      currentPx.current += delta * (1 - Math.exp(-elapsed / 180))

      if (Math.abs(targetPx.current - currentPx.current) < 0.25) {
        currentPx.current = targetPx.current
        paint(currentPx.current)
        frame.current = null
        return
      }

      paint(currentPx.current)
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    downX.current = e.clientX
    moved.current = 0
    setDragging(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer capture indisponível — os handlers no container cobrem */
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return

    const trackW = track.scrollWidth
    const maxScroll = getMaxScroll()
    if (maxScroll <= 0 || trackW <= 0) return

    moved.current = Math.max(moved.current, Math.abs(downX.current - e.clientX))
    // Meia tela de arrasto equivale à largura da área do carrossel.
    const maxDelta = window.innerWidth / 2
    const deltaPx = ((e.clientX - downX.current) / maxDelta) * container.clientWidth
    targetPx.current = Math.max(Math.min(prevPx.current + deltaPx, 0), -maxScroll)
    animateToTarget()
  }

  const onPointerUp = () => {
    if (!dragging) return
    setDragging(false)
    // Guarda o alvo solicitado, como o data-percentage do exemplo; a animação
    // pode continuar alguns frames depois que o ponteiro é solto.
    prevPx.current = targetPx.current
  }

  const navigate = (direction: -1 | 1) => {
    const track = trackRef.current
    const container = containerRef.current
    const images = track?.querySelectorAll<HTMLImageElement>('.image-track__img')
    const firstImage = images?.[0]
    if (!track || !container || !firstImage || !images?.length) return

    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0
    const stepPx = firstImage.getBoundingClientRect().width + gap
    // A seta muda uma posição inteira do trilho. Arredondar para o cartão
    // mais próximo também faz a navegação continuar precisa após um arrasto.
    const currentIndex = Math.round(-targetPx.current / stepPx)
    const nextIndex = Math.max(0, Math.min(images.length - 1, currentIndex - direction))
    targetPx.current = -nextIndex * stepPx
    prevPx.current = targetPx.current
    animateToTarget()
  }

  return (
    <div
      ref={containerRef}
      className={cn('image-track relative overflow-hidden select-none', dragging && 'dragging', className)}
      style={{ height }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => {
        // só é clique se o dedo/mouse não se moveu (senão era arrasto)
        if (moved.current >= 8 || !onImageClick) return
        // imagem mais próxima do centro do palco
        const track = trackRef.current
        if (!track) return
        const center = -currentPx.current
        let best = 0
        let bestDist = Infinity
        track.querySelectorAll<HTMLElement>('.image-track__img').forEach((el, i) => {
          const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center)
          if (d < bestDist) {
            bestDist = d
            best = i
          }
        })
        onImageClick(best)
      }}
    >
      {images.length > 2 && (
        <>
          <button
            type="button"
            aria-label="Ver modelos anteriores"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); navigate(1) }}
            className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 text-primary shadow-lg backdrop-blur-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Ver próximos modelos"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); navigate(-1) }}
            className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 text-primary shadow-lg backdrop-blur-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
      <div
        ref={trackRef}
        className="absolute left-1/2 top-1/2 flex gap-[4vmin] image-track__track"
        style={{ transform: 'translate3d(0, -50%, 0)' }}
      >
        {images.map((img) => (
          <img
            key={img.id}
            src={img.url}
            alt={img.alt || 'Modelo de unha'}
            draggable={false}
            className="image-track__img pointer-events-none"
          />
        ))}
      </div>
    </div>
  )
}
