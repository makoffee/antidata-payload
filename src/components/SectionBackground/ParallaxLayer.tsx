'use client'

import React, { useEffect, useRef } from 'react'

// How far the image drifts (as a share of the viewport height) while its section crosses the screen.
// The layer is this much taller than the screen, so it never shows an edge.
const TRAVEL = 0.2

// A viewport-pinned layer that moves up slowly as its section scrolls through the screen.
// Stays still for visitors who prefer reduced motion.
export const ParallaxLayer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = ref.current
    const section = layer?.parentElement
    if (!layer || !section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      if (rect.bottom < 0 || rect.top > vh) return // off screen
      // 0 when the section enters at the bottom, 1 when it leaves at the top
      const progress = Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1)
      layer.style.transform = `translate3d(0, ${(-progress * TRAVEL * vh).toFixed(1)}px, 0)`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <div aria-hidden className={className} ref={ref}>
      {children}
    </div>
  )
}
