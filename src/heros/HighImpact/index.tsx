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
        className="relative isolate -mt-[10.4rem] flex items-center justify-center bg-black text-white"
        data-theme="dark"
      >
        <div className="container mb-8 z-10 relative flex items-center">
          <div className="max-w-[40rem] lg:max-w-none">
            {keywords && keywords.length > 0 && (
              <motion.ul className="mb-8 flex flex-wrap gap-2" {...textIn(0.15)}>
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
              <motion.div {...textIn(0.25)}>
                {/* One-line name on desktop; the subline keeps a readable width */}
                <RichText
                  className="mb-10 prose-h1:text-4xl md:prose-h1:text-5xl lg:prose-h1:text-[3.25rem] prose-h1:font-black prose-h1:tracking-tight lg:prose-h1:whitespace-nowrap prose-p:max-w-[40rem]"
                  data={richText}
                  enableGutter={false}
                />
              </motion.div>
            )}
            {Array.isArray(links) && links.length > 0 && (
              <motion.ul className="flex flex-wrap gap-4" {...textIn(0.45)}>
                {links.map(({ link }, i) => {
                  return (
                    <li key={i}>
                      <CMSLink {...link} />
                    </li>
                  )
                })}
              </motion.ul>
            )}
          </div>
        </div>
        <div className="min-h-[80vh] select-none">
          {media && typeof media === 'object' && (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 -z-10 overflow-hidden"
              initial={backgroundFrom[style]}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              <Media fill imgClassName="object-cover" priority resource={media} />
            </motion.div>
          )}
        </div>
      </div>
    </MotionConfig>
  )
}
