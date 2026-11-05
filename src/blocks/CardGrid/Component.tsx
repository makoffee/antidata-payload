import type { CardGridBlock as CardGridBlockProps } from '@/payload-types'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utilities/ui'

import { cardIcons, type CardIconName } from './icons'

const columnClasses = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-2 lg:grid-cols-3',
  '4': 'md:grid-cols-2 lg:grid-cols-4',
}

export const CardGridBlock: React.FC<CardGridBlockProps & { id?: string }> = ({
  id,
  heading,
  text,
  columns,
  cards,
}) => {
  if (!cards?.length && !heading) return null

  return (
    <section className="container" id={`block-${id}`}>
      {(heading || text) && (
        <div className="mb-12 max-w-[40rem]">
          {heading && (
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight">{heading}</h2>
          )}
          {text && <p className="mt-4 text-lg text-muted-foreground">{text}</p>}
        </div>
      )}

      {cards && cards.length > 0 && (
        <ul className={cn('grid gap-6', columnClasses[columns || '3'])}>
          {cards.map(({ id: cardId, title, description, icon, url }) => {
            const Icon = icon ? cardIcons[icon as CardIconName]?.Icon : null
            const isExternal = Boolean(url && /^https?:\/\//.test(url))

            const card = (
              <Card
                className={cn(
                  'group relative h-full transition duration-300 ease-out',
                  'hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg',
                )}
              >
                <CardHeader className="gap-4">
                  <div className="flex items-start justify-between">
                    {Icon && (
                      <span className="inline-flex size-11 items-center justify-center rounded-md bg-muted text-foreground transition-colors duration-300 group-hover:bg-foreground group-hover:text-background">
                        <Icon aria-hidden className="size-5" />
                      </span>
                    )}
                    {url && (
                      <ArrowUpRight
                        aria-hidden
                        className="ml-auto size-5 text-muted-foreground opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                      />
                    )}
                  </div>
                  <CardTitle className="text-xl font-medium">{title}</CardTitle>
                  {description && (
                    <CardDescription className="text-base leading-relaxed">
                      {description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
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
    </section>
  )
}
