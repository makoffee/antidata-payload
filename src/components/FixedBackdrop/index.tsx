import React from 'react'

import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'

// A section background image. On desktop it covers the section. On phones the cards stack into
// a very tall section, and covering it would blow the image up until it pixelates, so there the
// image is one screen tall and sticks to the top while the section scrolls past.
// The parent section needs `relative isolate [clip-path:inset(0)]` (overflow-hidden would stop
// the sticky image from sticking).
export const FixedBackdrop: React.FC<{ resource: MediaType }> = ({ resource }) => {
  const { width, height } = resource
  // On a portrait phone a screen-tall cover image is drawn wider than the screen; tell the
  // browser how wide so it downloads enough pixels.
  const sizes =
    width && height
      ? `(max-width: 767px) calc(100vh * ${(width / height).toFixed(3)}), 100vw`
      : '100vw'

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="relative h-full max-md:sticky max-md:top-0 max-md:h-lvh">
          {/* Light mode flips a dark image into a bright one (invert + hue-rotate keeps its colours) */}
          <Media
            fill
            imgClassName="object-cover invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0"
            resource={resource}
            size={sizes}
          />
        </div>
      </div>
      {/* Theme tint keeps headings readable on any image */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/30 dark:bg-background/45" />
    </>
  )
}
