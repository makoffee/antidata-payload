'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { motion, MotionConfig, type TargetAndTransition } from 'motion/react'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

type Animation = NonNullable<Page['hero']['animation']>

// Starting states per "Intro animation" choice (set on the page's hero in the admin)
const backgroundFrom: Record<Animation, TargetAndTransition | false> = {
  fadeSlide: { opacity: 0, scale: 1.04 },
  fade: { opacity: 0 },
  none: false,
}
const textFrom: Record<Animation, TargetAndTransition | false> = {
  fadeSlide: { opacity: 0, x: 24 },
  fade: { opacity: 0 },
  none: false,
}

export const HighImpactHero: React.FC<Page['hero']> = ({
  animation,
  keywords,
  links,
  media,
  richText,
}) => {
  const { setHeaderTheme } = useHeaderTheme()
  const style: Animation = animation || 'fadeSlide'

  useEffect(() => {
    setHeaderTheme('dark')
  })

  const textIn = (delay: number) => ({
    initial: textFrom[style],
    animate: { opacity: 1, x: 0 },
    transition: { delay, duration: 0.7, ease: 'easeOut' as const },
  })

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="relative isolate -mt-[10.4rem] flex min-h-[90svh] flex-col bg-black text-white"
        data-theme="dark"
      >
        {/* The name sits just above the optical centre of the screen and everything else
            hangs below it, rather than the whole block being centred */}
        <div className="container relative z-10 pt-[30svh] pb-20 md:pt-[calc(41svh-2rem)] md:pb-24">
          <div className="max-w-[40rem] lg:max-w-none">
            {/* Glass keyword chips above the name, with space below so they don't compete with it */}
            {keywords && keywords.length > 0 && (
              <motion.ul className="mb-6 flex flex-wrap gap-2 md:mb-8" {...textIn(0.1)}>
                {keywords.map((keyword) => (
                  <li
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/85 backdrop-blur-md"
                    key={keyword}
                  >
                    {keyword}
                  </li>
                ))}
              </motion.ul>
            )}
            {richText && (
              <motion.div {...textIn(0.2)}>
                {/* One-line name on desktop; the subline stays about half to two-thirds of the width */}
                <RichText
                  className="mb-10 md:mb-16 prose-h1:text-[length:clamp(var(--text-phi-3),1.4rem+2.6vw,var(--text-phi-5))] prose-h1:font-black prose-h1:tracking-tight lg:prose-h1:whitespace-nowrap prose-p:max-w-[40rem] lg:prose-p:max-w-[max(50%,36rem)] prose-p:text-white/90 prose-p:text-[length:clamp(var(--text-phi-1),1.1rem+0.6vw,var(--text-phi-2))] prose-p:font-light prose-strong:font-semibold"
                  data={richText}
                  enableGutter={false}
                />
              </motion.div>
            )}
            {Array.isArray(links) && links.length > 0 && (
              <motion.ul
                className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4"
                {...textIn(0.45)}
              >
                {/* Full-width stacked buttons on phones, side by side from sm up */}
                {links.map(({ link }, i) => {
                  return (
                    <li key={i}>
                      <CMSLink {...link} className="h-12 w-full sm:h-10 sm:w-auto" />
                    </li>
                  )
                })}
              </motion.ul>
            )}
          </div>
        </div>
        <div className="select-none">
          {media && typeof media === 'object' && (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 -z-10 overflow-hidden"
              initial={backgroundFrom[style]}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              <Media fill imgClassName="object-cover" priority resource={media} />
              {/* Scrim so bright photos never fight the white text: darkest behind the copy
                  (left on desktop, everywhere on phones), plus a soft fade under the header */}
              <div
                aria-hidden
                className="absolute inset-0 bg-black/45 md:bg-transparent md:bg-linear-to-r md:from-black/75 md:via-black/40 md:via-55% md:to-black/5"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/50 to-transparent"
              />
            </motion.div>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}
