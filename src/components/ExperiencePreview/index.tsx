'use client'

import { ArrowUpRight, Monitor, Smartphone, X } from 'lucide-react'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  /** Shown in the desktop browser bar instead of the preview's own address (e.g. the real site
   *  when the preview is an archived demo) */
  addressLabel?: string | null
}

// The live site renders at a real device width and is scaled down to fit, so "Desktop" shows
// the actual desktop layout even beside the text block. Desktop is a 1280px laptop; mobile is
// an iPhone (393×852).
const DESKTOP_WIDTH = 1280
const PHONE = { width: 393, height: 852 }
const CHROME_HEIGHT = 36
const BORDER = 2 // 1px on each side

// Both views share one frame height, so switching never moves the page. It follows the column
// width, but never gets taller than ~72% of the window (the whole frame stays on screen) and
// stays within sensible bounds.
const frameHeightFor = (stageWidth: number, windowHeight: number) =>
  Math.round(Math.max(420, Math.min(680, stageWidth * 0.85, windowHeight * 0.72)))

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const PHONE_QUERY = '(max-width: 767px)'
const OVERLAY_STATE = 'experience-overlay'

const ViewToggle: React.FC<{
  className?: string
  onSelect: (v: View) => void
  view: View
}> = ({ className, onSelect, view }) => (
  <div
    aria-label="Preview size"
    className={cn('flex w-fit rounded-md border border-border p-1', className)}
    role="radiogroup"
  >
    {(['desktop', 'mobile'] as const).map((v) => {
      const Icon = v === 'desktop' ? Monitor : Smartphone
      return (
        <Button
          aria-checked={view === v}
          className={cn('capitalize', view === v && 'bg-muted')}
          key={v}
          onClick={() => onSelect(v)}
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
)

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
  addressLabel,
}) => {
  const [view, setView] = useState<View>('desktop')
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)
  const [isPhone, setIsPhone] = useState(false)
  // Width of a classic (space-taking) scrollbar in this browser: ~15px in desktop Firefox and on
  // Windows, 0 where scrollbars overlay the content (macOS Chrome/Safari, phones)
  const [scrollbarWidth, setScrollbarWidth] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)

  const preferred =
    source === 'figma'
      ? [figmaUrl && 'figma', liveUrl && 'live']
      : [liveUrl && 'live', figmaUrl && 'figma']
  const active = (preferred.find(Boolean) || null) as ExperienceSource | null
  const src = active === 'figma' ? figmaUrl : liveUrl
  const showFrame = Boolean(src) && (active === 'figma' || embeddable)

  // On a phone-sized screen, the mobile view IS the fullscreen overlay: it follows from the
  // device size and the selected view, so it's right on load, on tap and on rotate
  const fullscreen = showFrame && isPhone && view === 'mobile'
  // Behind the overlay the in-page preview stays on desktop (no second mobile iframe)
  const frameView: View = fullscreen ? 'desktop' : view

  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY)
    setIsPhone(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsPhone(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const selectView = (v: View) => {
    if (v === view) return
    if (v === 'mobile' && isPhone) {
      // A history entry, so the phone's back gesture closes the overlay instead of leaving the page
      window.history.pushState({ [OVERLAY_STATE]: true }, '')
    }
    if (v === 'desktop' && fullscreen && window.history.state?.[OVERLAY_STATE]) {
      window.history.back() // popstate (below) switches back to desktop
      return
    }
    setView(v)
  }

  useEffect(() => {
    if (!fullscreen) return
    const onPop = () => setView('desktop')
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && selectViewRef.current('desktop')
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
    }
  }, [fullscreen])

  // Latest selectView for the key handler without re-binding listeners each render
  const selectViewRef = useRef(selectView)
  selectViewRef.current = selectView

  useIsoLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setStageWidth(entry.contentRect.width))
    observer.observe(el)
    const onResize = () => setWindowHeight(window.innerHeight)
    onResize()
    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll'
    document.body.appendChild(probe)
    setScrollbarWidth(probe.offsetWidth - probe.clientWidth)
    probe.remove()
    window.addEventListener('resize', onResize)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const measured = stageWidth > 0 && windowHeight > 0
  const frameHeight = measured ? frameHeightFor(stageWidth, windowHeight) : 0
  const screenHeight = frameHeight - BORDER - (frameView === 'desktop' ? CHROME_HEIGHT : 0)
  // Desktop fills the column; mobile takes an iPhone's proportions at the same height
  const screenWidth =
    frameView === 'desktop'
      ? stageWidth - BORDER
      : Math.round((screenHeight * PHONE.width) / PHONE.height)
  const device =
    frameView === 'desktop'
      ? { width: DESKTOP_WIDTH, scale: screenWidth / DESKTOP_WIDTH }
      : { width: PHONE.width, scale: screenHeight / PHONE.height }

  return (
    <section
      id="experience"
      aria-labelledby="experience-title"
      className={cn(
        'container grid scroll-mt-24 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16',
        className,
      )}
    >
      {/* Content block */}
      <div className="lg:sticky lg:top-24 lg:self-start lg:pt-14">
        <h2 className="text-3xl md:text-5xl font-medium tracking-tight" id="experience-title">
          {title || 'The Experience'}
        </h2>
        {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}

        {links.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {links.map(({ href, label }) => (
              <Button asChild key={href} size="sm" variant="outline">
                {/* No "noreferrer": demos like zt-static only open when launched from antidata.net,
                    and the browser default sends just our origin, never the full URL */}
                <a href={href} rel="noopener" target="_blank">
                  {label}
                  <ArrowUpRight aria-hidden />
                </a>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Preview stage */}
      <div className="min-w-0">
        {showFrame && <ViewToggle className="mx-auto mb-4" onSelect={selectView} view={view} />}
        <div ref={stageRef}>
          {!showFrame ? (
            fallback
          ) : (
            <div
              className={cn(
                'mx-auto overflow-hidden border border-border bg-background shadow-lg transition-[width,border-radius] duration-300 ease-out',
                frameView === 'desktop' ? 'rounded-lg' : 'rounded-[1.75rem]',
              )}
              // Hidden until measured so it never flashes at full device width and overflows
              style={{
                width: screenWidth + BORDER,
                height: frameHeight,
                visibility: measured ? undefined : 'hidden',
              }}
            >
              {frameView === 'desktop' && (
                <div
                  className="flex items-center gap-2 border-b border-border bg-muted px-3"
                  style={{ height: CHROME_HEIGHT }}
                >
                  <span className="size-3 shrink-0 rounded-full bg-[#ff5f57]" />
                  <span className="size-3 shrink-0 rounded-full bg-[#febc2e]" />
                  <span className="size-3 shrink-0 rounded-full bg-[#28c840]" />
                  <span className="mx-auto max-w-[60%] truncate text-xs text-muted-foreground">
                    {active === 'figma'
                      ? 'Figma prototype'
                      : (addressLabel || src!)
                          .replace(/^https?:\/\/(www\.)?/, '')
                          .replace(/\/$/, '')}
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
                  key={`${frameView}-${src}`}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  // No allow-top-navigation: the embedded site can't navigate this page away
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  src={src!}
                  style={
                    // Figma scales its own canvas; the live site renders at device size, scaled down.
                    // The frame is widened by the scrollbar width so the site still gets the full
                    // device width; the scrollbar itself falls outside the clipped screen. Without
                    // this, desktop Firefox leaves the mobile view ~15px short and it scrolls sideways.
                    active === 'live'
                      ? {
                          width: device.width + scrollbarWidth,
                          height: screenHeight / device.scale,
                          transform: `scale(${device.scale})`,
                        }
                      : { width: '100%', height: '100%' }
                  }
                  title={`${title || 'Project'}: ${frameView} preview`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {fullscreen &&
        createPortal(
          <div
            aria-label={`${title || 'Project'}: mobile preview`}
            aria-modal="true"
            // overflow-hidden: nothing inside may widen the screen and cause sideways panning
            className="fixed inset-0 z-[100] overflow-hidden bg-background"
            role="dialog"
          >
            <iframe
              allowFullScreen
              // iOS Safari stretches an iframe to its content's width and ignores width: 100%; a 1px
              // width with min-width 100% pins it to the screen
              className="block h-dvh w-px min-w-full max-w-full border-0"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              src={src!}
              title={`${title || 'Project'}: mobile preview`}
            />
            <div
              className="fixed inset-x-0 flex justify-center px-4"
              style={{ bottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center gap-1 rounded-lg border border-border bg-background/85 p-1 shadow-lg backdrop-blur">
                <ViewToggle className="border-0 p-0" onSelect={selectView} view={view} />
                <Button
                  aria-label="Close preview and return to the page"
                  onClick={() => selectView('desktop')}
                  ref={closeRef}
                  size="sm"
                  variant="ghost"
                >
                  <X aria-hidden />
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}
