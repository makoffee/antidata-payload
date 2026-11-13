import React from 'react'

import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'

// A section background pinned to the viewport: the image is sized to the screen, not to the
// section, so it stays sharp on tall mobile sections, and frosted cards change colour as they
// scroll over it. The parent section needs `relative isolate [clip-path:inset(0)]` — clip-path
// (unlike overflow) clips fixed children, so the image only shows behind its own section.
export const FixedBackdrop: React.FC<{ resource: MediaType }> = ({ resource }) => {
  const { width, height } = resource
  // With object-cover on a portrait screen the image is scaled to the viewport height, so it
  // needs more pixels than 100vw; tell the browser how wide it will really be drawn.
  const sizes =
    width && height
      ? `(max-aspect-ratio: ${width}/${height}) calc(100vh * ${(width / height).toFixed(3)}), 100vw`
      : '100vw'

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-20 h-lvh">
        {/* Light mode flips a dark image into a bright one (invert + hue-rotate keeps its colours) */}
        <Media
          fill
          imgClassName="object-cover invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0"
          resource={resource}
          size={sizes}
        />
      </div>
      {/* Theme tint keeps headings readable on any image */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/30 dark:bg-background/45" />
    </>
  )
}
