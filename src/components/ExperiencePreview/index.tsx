'use client'

import { ArrowUpRight, Monitor, Smartphone } from 'lucide-react'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

export type ExperienceSource = 'live' | 'figma'
type View = 'desktop' | 'mobile'

export type ExperienceLink = { href: string; label: string }

export type ExperiencePreviewProps = {
  className?: string
  description?: string | null
  /** False when the live site refuses to be shown in an iframe; `fallback` is shown instead */
  embeddable?: boolean
  fallback?: React.ReactNode
  /** Ready-to-embed Figma URL (embed.figma.com/…) */
  figmaUrl?: string | null
  links?: ExperienceLink[]
  liveUrl?: string | null
  /** Which URL to preview. Falls back to the other one when the chosen one is missing. */
  source?: ExperienceSource
  title?: string | null
}

// The live site renders at a real device width and is scaled down to fit its column, so
// "Desktop" shows the actual desktop layout even beside the text block
const VIEWPORTS: Record<View, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
}
const CHROME_HEIGHT = 36

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export const ExperiencePreview: React.FC<ExperiencePreviewProps> = ({
  className,
  description,
  embeddable = true,
  fallback,
  figmaUrl,
  links = [],
  liveUrl,
  source = 'live',
  title,
}) => {
  const [view, setView] = useState<View>('desktop')
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(0)

  const preferred = source === 'figma' ? [figmaUrl && 'figma', liveUrl && 'live'] : [liveUrl && 'live', figmaUrl && 'figma']
  const active = (preferred.find(Boolean) || null) as ExperienceSource | null
  const src = active === 'figma' ? figmaUrl : liveUrl
  const showFrame = Boolean(src) && (active === 'figma' || embeddable)

  // Phones get the mobile view first
  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) setView('mobile')
  }, [])

  useIsoLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const viewport = VIEWPORTS[view]
  // -2 for the 1px border on each side
  const scale = stageWidth ? Math.min(1, (stageWidth - 2) / viewport.width) : 0
  const screenWidth = viewport.width * scale
  const screenHeight = viewport.height * scale

  return (
    <section
      aria-labelledby="experience-title"
      className={cn(
        'container grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16',
        className,
      )}
    >
      {/* Content block */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight" id="experience-title">
          {title || 'Experience it'}
        </h2>
        {description && <p className="mt-4 text-muted-foreground">{description}</p>}

        {showFrame && (
          <div
            aria-label="Preview size"
            className="mt-8 inline-flex rounded-md border border-border p-1"
            role="radiogroup"
          >
            {(['desktop', 'mobile'] as const).map((v) => {
              const Icon = v === 'desktop' ? Monitor : Smartphone
              return (
                <Button
                  aria-checked={view === v}
                  className={cn('capitalize', view === v && 'bg-muted')}
                  key={v}
                  onClick={() => setView(v)}
                  role="radio"
                  size="sm"
                  variant="ghost"
                >
                  <Icon aria-hidden />
                  {v}
                </Button>
              )
            })}
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {links.map(({ href, label }) => (
              <Button asChild key={href} size="sm" variant="outline">
                <a href={href} rel="noopener noreferrer" target="_blank">
                  {label}
                  <ArrowUpRight aria-hidden />
                </a>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Preview stage */}
      <div className="min-w-0 rounded-xl bg-muted/50 p-4 md:p-6" ref={stageRef}>
        {!showFrame ? (
          fallback
        ) : (
          <div
            className={cn(
              'mx-auto overflow-hidden border border-border bg-background shadow-lg transition-[width,border-radius] duration-300 ease-out',
              view === 'desktop' ? 'rounded-lg' : 'rounded-[1.75rem]',
            )}
            // Hidden until measured so it never flashes at full device width and overflows
            style={{ width: screenWidth + 2, visibility: scale ? undefined : 'hidden' }}
          >
            {view === 'desktop' && (
              <div
                className="flex items-center gap-2 border-b border-border bg-muted px-3"
                style={{ height: CHROME_HEIGHT }}
              >
                <span className="size-3 shrink-0 rounded-full bg-[#ff5f57]" />
                <span className="size-3 shrink-0 rounded-full bg-[#febc2e]" />
                <span className="size-3 shrink-0 rounded-full bg-[#28c840]" />
                <span className="mx-auto max-w-[60%] truncate rounded bg-background px-3 py-0.5 text-xs text-muted-foreground">
                  {active === 'figma'
                    ? 'Figma prototype'
                    : src!.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </span>
                {/* Balances the traffic lights so the address bar stays centred */}
                <span className="w-[3.25rem] shrink-0" />
              </div>
            )}
            <div className="relative overflow-hidden" style={{ height: screenHeight }}>
              <iframe
                allowFullScreen
                className="absolute left-0 top-0 origin-top-left border-0"
                // Remount on view change so the site re-runs its responsive layout at the new width
                key={`${view}-${src}`}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                // No allow-top-navigation: the embedded site can't navigate this page away
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                src={src!}
                style={
                  // Figma scales its own canvas; the live site renders at device size, scaled down
                  active === 'live'
                    ? { width: viewport.width, height: viewport.height, transform: `scale(${scale})` }
                    : { width: '100%', height: '100%' }
                }
                title={`${title || 'Project'}: ${view} preview`}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
