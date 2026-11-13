import React from 'react'

import type { Appearance, Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { getCachedGlobal } from '@/utilities/getGlobals'

import { ParallaxLayer } from './ParallaxLayer'

// Background image behind a card section. The style is set site-wide in Site settings → Appearance:
// - cover:    covers the section on desktop. On phones the cards stack into a very tall section,
//             so the image is one screen tall and sticks while the section scrolls (no pixelation).
// - fixed:    one screen tall, pinned to the viewport; the section is a window onto it.
// - parallax: like fixed, but drifts slowly upward as the section scrolls by.
// The parent section needs `relative isolate [clip-path:inset(0)]`: clip-path (unlike overflow)
// clips fixed children and doesn't break sticky ones.
async function getBackgroundStyle(): Promise<NonNullable<Appearance['backgroundStyle']>> {
  try {
    const appearance = (await getCachedGlobal('appearance')()) as Appearance
    return appearance?.backgroundStyle ?? 'parallax'
  } catch {
    // e.g. the Appearance table doesn't exist yet (migration not run)
    return 'parallax'
  }
}

export const SectionBackground = async ({ resource }: { resource: MediaType }) => {
  const style = await getBackgroundStyle()

  const { width, height } = resource
  const ratio = width && height ? (width / height).toFixed(3) : null
  // A screen-tall cover image on a portrait screen is drawn wider than the screen; tell the
  // browser how wide so it downloads enough pixels.
  const sizes = !ratio
    ? '100vw'
    : style === 'cover'
      ? `(max-width: 767px) calc(100vh * ${ratio}), 100vw`
      : `(max-aspect-ratio: ${width}/${height}) calc(120vh * ${ratio}), 100vw`

  const image = (
    // Light mode flips a dark image into a bright one (invert + hue-rotate keeps its colours)
    <Media
      fill
      imgClassName="object-cover invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0"
      resource={resource}
      size={sizes}
    />
  )

  return (
    <>
      {style === 'cover' ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
          <div className="relative h-full max-md:sticky max-md:top-0 max-md:h-lvh">{image}</div>
        </div>
      ) : style === 'fixed' ? (
        <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-20 h-lvh">
          {image}
        </div>
      ) : (
        <ParallaxLayer className="pointer-events-none fixed inset-x-0 top-0 -z-20 h-[calc(100lvh+20vh)]">
          {image}
        </ParallaxLayer>
      )}
      {/* Theme tint keeps headings readable on any image */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/30 dark:bg-background/45" />
    </>
  )
}
