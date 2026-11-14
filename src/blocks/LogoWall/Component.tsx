import type { LogoWallBlock as LogoWallBlockProps } from '@/payload-types'

import React from 'react'

import { Reveal } from '@/components/Reveal'

import { sectionHeadingClass, sectionTextClass } from '@/utilities/sectionHeading'
import { cn } from '@/utilities/ui'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export const LogoWallBlock: React.FC<LogoWallBlockProps & { id?: string }> = ({
  id,
  heading,
  text,
  logos,
}) => {
  const items = (logos || []).filter((item) => item.logo && typeof item.logo === 'object')

  return (
    <section className="container" id={`block-${id}`}>
      {(heading || text) && (
        <Reveal className="mx-auto mb-12 max-w-[48rem] text-center">
          {heading && <h2 className={sectionHeadingClass}>{heading}</h2>}
          {text && <p className={cn(sectionTextClass, 'text-muted-foreground')}>{text}</p>}
        </Reveal>
      )}

      {items.length > 0 && (
        // Flex-wrap (not grid) so a partly filled last row stays centred
        <Reveal delay={0.1}>
          <ul className="flex flex-wrap justify-center md:gap-y-4">
            {items.map(({ id: itemId, logo, logoDark, name, url }) => {
              if (!logo || typeof logo !== 'object') return null
              const dark = logoDark && typeof logoDark === 'object' ? logoDark : null

              // Full-colour logos. On hover a gentle scale-up with a slight overshoot (spring feel),
              // done in CSS so the block stays a server component.
              const imgClass = cn(
                'max-h-7 sm:max-h-10 md:max-h-12 w-auto max-w-[85%] sm:max-w-[70%] object-contain',
                'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105',
                'motion-reduce:transition-none motion-reduce:group-hover:scale-100',
              )

              // Plain <img> so SVG logos render as-is (Next's image optimizer rejects SVG).
              // With a dark-mode version, each theme shows its own file.
              const image = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={name}
                    className={cn(imgClass, dark && 'dark:hidden')}
                    height={logo.height || undefined}
                    loading="lazy"
                    src={getMediaUrl(logo.url, logo.updatedAt)}
                    width={logo.width || undefined}
                  />
                  {dark && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={name}
                      className={cn(imgClass, 'hidden dark:block')}
                      height={dark.height || undefined}
                      loading="lazy"
                      src={getMediaUrl(dark.url, dark.updatedAt)}
                      width={dark.width || undefined}
                    />
                  )}
                </>
              )

              const cellClass =
                'group flex aspect-[2/1] sm:aspect-[3/2] items-center justify-center p-2 sm:p-6'

              return (
                <li className="w-1/3 md:w-1/4 lg:w-1/5" key={itemId}>
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
        </Reveal>
      )}
    </section>
  )
}
