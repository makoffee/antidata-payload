'use client'

import React from 'react'

type Props = Omit<React.ComponentProps<'a'>, 'href'> & {
  /** id of the element to scroll to, without the # */
  targetId: string
}

// An in-page anchor that glides to its target. Falls back to a normal jump when the visitor
// prefers reduced motion, and keeps the address bar free of #fragments.
export const ScrollToLink: React.FC<Props> = ({ targetId, onClick, ...props }) => (
  <a
    href={`#${targetId}`}
    onClick={(e) => {
      onClick?.(e)
      const target = document.getElementById(targetId)
      if (!target || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return
      e.preventDefault()
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }}
    {...props}
  />
)
