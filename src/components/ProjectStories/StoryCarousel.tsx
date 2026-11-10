'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

// Horizontal, snap-scrolling row of story cards. Scrolling itself is native (swipe, trackpad,
// shift+wheel); this adds paging arrows on hover (tablet/desktop) and a page indicator.
export const StoryCarousel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const rowRef = useRef<HTMLUListElement>(null)
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)

  // How far one "page" is: as many whole cards as fit in the visible width
  const measure = useCallback(() => {
    const row = rowRef.current
    const first = row?.children[0] as HTMLElement | undefined
    if (!row || !first) return null
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0
    const card = first.offsetWidth + gap
    const perPage = Math.max(1, Math.floor((row.clientWidth + gap) / card))
    return { row, step: card * perPage, perPage, total: row.children.length }
  }, [])

  const update = useCallback(() => {
    const m = measure()
    if (!m) return
    const count = Math.max(1, Math.ceil(m.total / m.perPage))
    const atEnd = m.row.scrollLeft + m.row.clientWidth >= m.row.scrollWidth - 2
    setPages(count)
    setPage(atEnd ? count - 1 : Math.min(count - 1, Math.round(m.row.scrollLeft / m.step)))
  }, [measure])

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    update()
    const resize = new ResizeObserver(update)
    resize.observe(row)
    row.addEventListener('scroll', update, { passive: true })
    return () => {
      resize.disconnect()
      row.removeEventListener('scroll', update)
    }
  }, [update])

  const goTo = (index: number) => {
    const m = measure()
    if (m) m.row.scrollTo({ left: index * m.step, behavior: 'smooth' })
  }

  // Same frosted glass as the Design expertise cards; centred on the cards, not the dots
  const arrow = cn(
    'absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground shadow-lg md:flex',
    'border border-white/60 bg-white/45 backdrop-blur-xl backdrop-saturate-150 hover:bg-white/60',
    'dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]',
    'opacity-0 transition-[opacity,background-color] duration-300 group-hover/carousel:opacity-100 focus-visible:opacity-100',
  )

  return (
    <div className="group/carousel">
      <div className="relative">
        <ul
          className={cn(
            'flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain md:gap-6',
            // Room for the cards' 12px reveal slide, so it isn't clipped or turned into a vertical scroll
            '-my-3 py-3',
            // Phones bleed to the screen edge so the next card peeks in
            '-mx-4 px-4 scroll-px-4 md:mx-0 md:px-0 md:scroll-px-0',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            className,
          )}
          ref={rowRef}
        >
          {children}
        </ul>

        {page > 0 && (
          <button
            aria-label="Previous projects"
            className={cn(arrow, 'left-3')}
            onClick={() => goTo(page - 1)}
            type="button"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
        )}
        {page < pages - 1 && (
          <button
            aria-label="Next projects"
            className={cn(arrow, 'right-3')}
            onClick={() => goTo(page + 1)}
            type="button"
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
        )}
      </div>

      {pages > 1 && (
        <div aria-label="Project pages" className="mt-6 flex justify-center gap-2" role="tablist">
          {Array.from({ length: pages }, (_, i) => (
            <button
              aria-label={`Page ${i + 1} of ${pages}`}
              aria-selected={i === page}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === page
                  ? 'w-6 bg-foreground'
                  : 'w-2 border border-foreground/40 hover:border-foreground/70',
              )}
              key={i}
              onClick={() => goTo(i)}
              role="tab"
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  )
}
