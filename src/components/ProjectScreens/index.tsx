import React from 'react'

import type { Project } from '@/payload-types'

import { RevealCard } from '@/blocks/CardGrid/RevealCard'
import { SectionBackground } from '@/components/SectionBackground'
import { Media } from '@/components/Media'
import { Reveal } from '@/components/Reveal'
import { CardHeader, CardTitle } from '@/components/ui/card'
import { sectionHeadingClass, sectionTextClass } from '@/utilities/sectionHeading'
import { cn } from '@/utilities/ui'

const columnClasses: Record<number, string> = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

// A case study's screens (e.g. wireframes) side by side in frosted cards over a branded banner,
// matching the Cards block. The screens stay small: they show structure, not detail.
export const ProjectScreens: React.FC<{
  className?: string
  screens: NonNullable<Project['screens']>
}> = ({ className, screens }) => {
  const items = (screens.items ?? []).filter((item) => item.image && typeof item.image === 'object')
  if (!items.length) return null

  const background =
    screens.backgroundImage && typeof screens.backgroundImage === 'object' ? screens.backgroundImage : null

  return (
    <section
      aria-labelledby={screens.heading ? 'project-screens' : undefined}
      className={cn(background && 'relative isolate [clip-path:inset(0)] py-20 md:py-28', className)}
    >
      {background && <SectionBackground resource={background} />}

      <div className="container">
        {(screens.heading || screens.text) && (
          <Reveal className="mb-12 max-w-[48rem]">
            {screens.heading && (
              <h2 className={sectionHeadingClass} id="project-screens">
                {screens.heading}
              </h2>
            )}
            {screens.text && <p className={sectionTextClass}>{screens.text}</p>}
          </Reveal>
        )}

        <ul className={cn('grid gap-6', columnClasses[Math.min(items.length, 4)])}>
          {items.map(({ id, label, image }, index) => (
            <li key={id ?? index}>
              <RevealCard
                className={cn(
                  'h-full overflow-hidden',
                  // Frosted glass over the banner image, light or dark with the theme
                  background &&
                    'border-white/60 bg-white/45 shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06]',
                )}
                delay={(index % 4) * 0.06}
              >
                <CardHeader className="px-4 pt-4 pb-3">
                  <CardTitle className="text-base font-medium">{label}</CardTitle>
                </CardHeader>
                <div className="px-4 pb-4">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-border/60 bg-muted">
                    <Media
                      fill
                      imgClassName="object-cover object-top"
                      resource={image as Exclude<typeof image, number>}
                      size="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                </div>
              </RevealCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
