import type { LogoWallBlock as LogoWallBlockProps } from '@/payload-types'

import React from 'react'

import { cn } from '@/utilities/ui'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export const LogoWallBlock: React.FC<LogoWallBlockProps & { id?: string }> = ({
  id,
  heading,
  text,
  logos,
  monochrome,
}) => {
  const items = (logos || []).filter((item) => item.logo && typeof item.logo === 'object')

  return (
    <section className="container" id={`block-${id}`}>
      {(heading || text) && (
        <div className="mx-auto mb-12 max-w-[40rem] text-center">
          {heading && (
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight">{heading}</h2>
          )}
          {text && <p className="mt-4 text-lg text-muted-foreground">{text}</p>}
        </div>
      )}

      {items.length > 0 && (
        // Flex-wrap (not grid) so a partly filled last row stays centred
        <ul className="flex flex-wrap justify-center gap-y-4">
          {items.map(({ id: itemId, logo, name, url }) => {
            if (!logo || typeof logo !== 'object') return null

            // Plain <img> so SVG logos render as-is (Next's image optimizer rejects SVG)
            const image = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={name}
                className={cn(
                  'max-h-10 md:max-h-12 w-auto max-w-[70%] object-contain transition duration-300',
                  monochrome && 'grayscale group-hover:grayscale-0',
                )}
                height={logo.height || undefined}
                loading="lazy"
                src={getMediaUrl(logo.url, logo.updatedAt)}
                width={logo.width || undefined}
              />
            )

            const cellClass =
              'group flex aspect-[3/2] items-center justify-center p-6'

            return (
              <li className="w-1/2 sm:w-1/3 lg:w-1/5" key={itemId}>
                {url ? (
                  <a
                    aria-label={name}
                    className={cellClass}
                    href={url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {image}
                  </a>
                ) : (
                  <div className={cellClass}>{image}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
