import React from 'react'

import { Logo, LogoIcon } from '@/components/Logo/Logo'

// The admin doesn't load the site's Tailwind, so size with inline styles. Colour follows the
// admin theme (--theme-text), so the same SVG reads in both light and dark mode.
const colour = 'var(--theme-text)'

// Login screen and other large placements: the full wordmark
export const AdminLogo: React.FC = () => (
  <Logo style={{ color: colour, height: 'auto', maxWidth: '100%', width: 260 }} />
)

// Sidebar header and other small placements: the mark on its own
export const AdminIcon: React.FC = () => (
  // Payload's breadcrumb/nav slot is an 18px box that clips overflow, so fill it exactly
  <LogoIcon style={{ color: colour, display: 'block', height: 'auto', width: '100%' }} />
)
