'use client'

import React, { useEffect, useState } from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SearchIcon } from 'lucide-react'

import { useTheme } from '@/providers/Theme'
import { ThemeToggle } from '@/providers/Theme/ThemeSelector'

type NavLink = NonNullable<HeaderType['navItems']>[number]['link']

// Contact is the one call to action: solid foreground button (white on dark, black on light)
const isContact = (link: NavLink) =>
  /contact/i.test(link.label || '') || /contact/i.test(link.url || '')

const contactClass =
  'rounded-full bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-85'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const links = navItems.filter(({ link }) => !isContact(link))
  const contact = navItems.find(({ link }) => isContact(link))?.link
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  // The landing page forces the header to the dark theme (white logo over the hero photo).
  // The dropdown panel follows the site's real light/dark choice instead.
  const { theme: siteTheme } = useTheme()

  // Close the mobile menu after navigating, or on Escape
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <div className="flex items-center gap-5">
        {/* Desktop */}
        <nav className="hidden items-center gap-5 md:flex">
          {links.map(({ link }, i) => (
            <CMSLink key={i} {...link} appearance="link" />
          ))}
        </nav>
        {/* Search stays an icon on every screen size, left of Contact / the menu button */}
        <Link href="/search">
          <span className="sr-only">Search</span>
          <SearchIcon className="w-5 text-primary" />
        </Link>
        <ThemeToggle />
        {contact && <CMSLink {...contact} className={cn(contactClass, 'hidden md:inline-flex')} />}

        {/* Mobile: animated bars / X */}
        <button
          aria-controls="mobile-menu"
          aria-expanded={open}
          className="relative -mr-2 flex size-10 items-center justify-center text-foreground md:hidden"
          onClick={() => setOpen((o) => !o)}
          type="button"
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span aria-hidden className="relative block h-3.5 w-5">
            {['top-0', 'top-1/2 -translate-y-1/2', 'bottom-0'].map((position, i) => (
              <span
                className={cn(
                  'absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out',
                  position,
                  open && i === 0 && 'top-1/2 -translate-y-1/2 rotate-45',
                  open && i === 1 && 'opacity-0',
                  open && i === 2 && 'bottom-auto top-1/2 -translate-y-1/2 -rotate-45',
                )}
                key={i}
              />
            ))}
          </span>
        </button>
      </div>

      <div
        className={cn(
          'absolute inset-x-4 top-full origin-top rounded-lg border bg-background/95 p-4 text-foreground shadow-lg backdrop-blur-xl transition-[opacity,scale,translate] duration-200 ease-out md:hidden',
          open ? 'scale-100 opacity-100' : 'pointer-events-none -translate-y-2 scale-95 opacity-0',
        )}
        data-theme={siteTheme}
        id="mobile-menu"
        inert={!open}
        suppressHydrationWarning
      >
        <nav className="flex flex-col">
          {links.map(({ link }, i) => (
            <CMSLink className="py-3 text-lg" key={i} {...link} />
          ))}
          {contact && (
            <CMSLink {...contact} className={cn(contactClass, 'mt-3 py-3 text-center text-lg')} />
          )}
        </nav>
      </div>
    </>
  )
}
