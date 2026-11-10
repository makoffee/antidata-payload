'use client'

import { motion, MotionConfig } from 'motion/react'
import React from 'react'

import { cn } from '@/utilities/ui'

// A shadcn Card that fades in on scroll (no movement: sliding glass re-blurs every frame and flickers),
// animating itself rather than a wrapper.
// backdrop-filter (the frosted glass) has nothing to blur while an ancestor is fading, so
// animating a parent made the glass pop in at the end; the card's own opacity keeps it intact.
export const RevealCard: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
}> = ({ children, className, delay = 0 }) => (
  <MotionConfig reducedMotion="user">
    <motion.div
      className={cn('bg-card text-card-foreground rounded-lg border shadow-sm', className)}
      data-slot="card"
      initial={{ opacity: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      viewport={{ once: true, margin: '0px 0px -20% 0px' }}
      whileInView={{ opacity: 1 }}
    >
      {children}
    </motion.div>
  </MotionConfig>
)
