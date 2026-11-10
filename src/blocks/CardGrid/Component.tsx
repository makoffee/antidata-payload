import type { CardGridBlock as CardGridBlockProps } from '@/payload-types'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Reveal } from '@/components/Reveal'

import { Media } from '@/components/Media'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sectionHeadingClass, sectionTextClass } from '@/utilities/sectionHeading'
import { cn } from '@/utilities/ui'

import { cardIcons, type CardIconName } from './icons'
import { RevealCard } from './RevealCard'

const columnClasses = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-2 lg:grid-cols-3',
  '4': 'md:grid-cols-2 lg:grid-cols-4',
}

export const CardGridBlock: React.FC<CardGridBlockProps & { id?: string }> = ({
  id,
  heading,
  text,
  backgroundImage,
  columns,
  cards,
}) => {
  if (!cards?.length && !heading) return null

  const background = backgroundImage && typeof backgroundImage === 'object' ? backgroundImage : null

  return (
    <section
      className={cn(background && 'relative isolate overflow-hidden py-20 md:py-28 mb-16 md:mb-24')}
      id={`block-${id}`}
    >
      {background && (
        <>
          <div aria-hidden className="absolute inset-0 -z-20">
            {/* Light mode flips a dark image into a bright one (invert + hue-rotate keeps its colours) */}
            <Media
              fill
              imgClassName="object-cover invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0"
              resource={background}
              size="100vw"
            />
          </div>
          {/* Theme tint keeps the heading readable on any image */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-background/30 dark:bg-background/45"
          />
        </>
      )}

      <div className="container">
        {(heading || text) && (
          <Reveal className="mb-12 max-w-[48rem]">
            {heading && <h2 className={sectionHeadingClass}>{heading}</h2>}
            {text && <p className={sectionTextClass}>{text}</p>}
          </Reveal>
        )}

        {cards && cards.length > 0 && (
          <ul className={cn('grid gap-6', columnClasses[columns || '3'])}>
            {cards.map(({ id: cardId, title, description, icon, url }, index) => {
              const Icon = icon ? cardIcons[icon as CardIconName]?.Icon : null
              const isExternal = Boolean(url && /^https?:\/\//.test(url))

              const card = (
                <RevealCard
                  delay={(index % 3) * 0.06}
                  className={cn(
                    // Hover transition only; opacity is left to the scroll fade
                    'group relative h-full transition-[translate,box-shadow,border-color,background-color] duration-300 ease-out',
                    'hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg',
                    // Frosted glass over the background image, light or dark with the theme
                    background &&
                      'border-white/60 bg-white/45 shadow-sm backdrop-blur-xl backdrop-saturate-150 hover:bg-white/60 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]',
                  )}
                >
                  <CardHeader className="gap-4">
                    {/* Icon box and title share one row */}
                    <div className="flex items-center gap-4">
                      {Icon && (
                        <span
                          className={cn(
                            'inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-muted text-foreground transition-colors duration-300 group-hover:bg-foreground group-hover:text-background',
                            background &&
                              'bg-white/70 dark:bg-white/10 dark:group-hover:bg-white dark:group-hover:text-black',
                          )}
                        >
                          <Icon aria-hidden className="size-5" />
                        </span>
                      )}
                      <CardTitle className="text-xl font-medium">{title}</CardTitle>
                      {url && (
                        <ArrowUpRight
                          aria-hidden
                          className="ml-auto size-5 shrink-0 self-start text-muted-foreground opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                        />
                      )}
                    </div>
                    {description && (
                      <CardDescription
                        className={cn(
                          'text-base',
                          background && 'text-foreground/75',
                        )}
                      >
                        {description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </RevealCard>
              )

              return (
                <li key={cardId}>
                  {url ? (
                    <Link
                      className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
                      href={url}
                      {...(isExternal ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
                    >
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
