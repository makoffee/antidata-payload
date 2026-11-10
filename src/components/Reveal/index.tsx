'use client'

import { motion, MotionConfig } from 'motion/react'
import React from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  /** Seconds to wait before starting, e.g. index * 0.08 to stagger a row of cards */
  delay?: number
}

// Fades content up a few pixels the first time it scrolls into view: plain ease-out, no
// springs, plays once. With "reduce motion" on, Motion drops the movement and keeps a soft fade.
export const Reveal: React.FC<Props> = ({ children, className, delay = 0 }) => (
  <MotionConfig reducedMotion="user">
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      // Waits until content is clear of the bottom fifth of the screen, so anything peeking
      // below the hero on first load stays put until the visitor scrolls
      viewport={{ once: true, margin: '0px 0px -20% 0px' }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  </MotionConfig>
)
