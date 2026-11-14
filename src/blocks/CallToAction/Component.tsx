import { Phone } from 'lucide-react'
import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'
import { RevealCard } from '@/blocks/CardGrid/RevealCard'

// Frosted glass like the Design expertise cards, over an optional background image (set in the
// admin). The card fades in on its own (no slide, no fading wrapper, so the glass blur
// doesn't pop), a beat after the logo wall above it
export const CallToActionBlock: React.FC<CTABlockProps> = ({
  backgroundImage,
  links,
  richText,
}) => {
  const background = backgroundImage && typeof backgroundImage === 'object' ? backgroundImage : null

  return (
    // Equal room above and below so the card floats in the middle. -mb-40 cancels the block's
    // my-16 and the page's pb-24 so the image runs right down to the footer, like the hero
    <section className="relative isolate -mb-40 py-32 md:py-48">
      {background && (
        <div aria-hidden className="absolute inset-0 -z-10">
          <Media fill imgClassName="object-cover" resource={background} size="100vw" />
        </div>
      )}
      <div className="container">
        <RevealCard
          className="mx-auto flex max-w-4xl flex-col gap-8 rounded-lg border border-white/60 bg-white/65 p-6 text-card-foreground shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/45 md:flex-row md:items-center md:justify-between md:p-8"
          delay={0.4}
        >
          <div className="flex max-w-[48rem] items-start gap-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <Phone aria-hidden className="size-5 motion-safe:animate-ring" />
            </span>
            {richText && (
              <RichText
                className="mb-0 prose-h3:mt-1.5 prose-h3:mb-2 prose-h3:text-2xl prose-h3:font-medium prose-p:my-0 prose-p:text-base prose-p:text-foreground/90"
                data={richText}
                enableGutter={false}
              />
            )}
          </div>
          <div className="flex flex-col gap-4">
            {(links || []).map(({ link }, i) => {
              return <CMSLink key={i} size="lg" {...link} className="w-full md:w-auto" />
            })}
          </div>
        </RevealCard>
      </div>
    </section>
  )
}
