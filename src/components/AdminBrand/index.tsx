import type { Payload } from 'payload'
import React from 'react'

import { BrandMark } from '@/components/Logo/BrandMark'

// The admin doesn't load the site's Tailwind, so size with inline styles. The artwork takes the
// admin text colour (--theme-text), so it reads in both themes. The files come from
// Site settings → Appearance → Logo / Icon, the same ones the public site uses.
const colour = 'var(--theme-text)'

const urlOf = (media: unknown): string | null =>
  media && typeof media === 'object' && 'url' in media && typeof media.url === 'string'
    ? media.url
    : null

const Branded = async ({ payload, variant }: { payload?: Payload; variant: 'icon' | 'logo' }) => {
  let src: string | null = null
  try {
    if (payload) {
      const appearance = await payload.findGlobal({ slug: 'appearance', depth: 1 })
      src = urlOf(appearance.adminBranding?.[variant])
    }
  } catch {
    // fall back to the built-in artwork
  }

  const style: React.CSSProperties =
    variant === 'logo'
      ? { color: colour, height: 'auto', maxWidth: '100%', width: 260 }
      : // Payload's breadcrumb slot is an 18px box that clips overflow
        { color: colour, display: 'block', height: 'auto', width: '100%' }

  return <BrandMark src={src} style={style} variant={variant} />
}

export const AdminLogo = ({ payload }: { payload?: Payload }) => (
  <Branded payload={payload} variant="logo" />
)
export const AdminIcon = ({ payload }: { payload?: Payload }) => (
  <Branded payload={payload} variant="icon" />
)
