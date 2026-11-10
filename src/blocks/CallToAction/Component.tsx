import { Phone } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'
import { RevealCard } from '@/blocks/CardGrid/RevealCard'

// Template starter image (Media library), not otherwise used on the homepage
const backgroundSrc = '/api/media/file/image-post1.webp'

// Frosted glass like the Design expertise cards, over a background image that fades in from the
// page colour. The card fades in on its own (no slide, no fading wrapper, so the glass blur
// doesn't pop), a beat after the logo wall above it
export const CallToActionBlock: React.FC<CTABlockProps> = ({ links, richText }) => {
  return (
    // Equal room above and below so the card floats in the middle. -mb-40 cancels the block's
    // my-16 and the page's pb-24 so the image runs right down to the footer, like the hero
    <section className="relative isolate -mb-40 py-24 md:py-32">
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          alt=""
          className="object-cover"
          fill
          quality={100}
          sizes="100vw"
          src={backgroundSrc}
        />
        <div className="absolute inset-0 bg-linear-to-b from-background to-transparent" />
      </div>
      <div className="container">
        <RevealCard
          className="flex flex-col gap-8 rounded-lg border border-white/60 bg-white/45 p-6 text-card-foreground shadow-sm backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.06] md:flex-row md:items-center md:justify-between md:p-8"
          delay={0.4}
        >
          <div className="flex max-w-[48rem] items-start gap-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#ccff00] text-black">
              <Phone aria-hidden className="size-5 motion-safe:animate-ring" />
            </span>
            {richText && (
              <RichText
                className="mb-0 prose-h3:mt-1.5 prose-h3:mb-2 prose-h3:text-2xl prose-h3:font-medium prose-p:my-0 prose-p:text-base prose-p:text-muted-foreground"
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
