'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { BrandMark } from '@/components/Logo/BrandMark'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  branding: { icon: string | null; logo: string | null }
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ branding, data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header className="container relative z-20   " {...(theme ? { 'data-theme': theme } : {})}>
      <div className="py-8 flex items-center justify-between">
        <Link href="/">
          <BrandMark
            className="size-9 text-foreground md:hidden"
            src={branding.icon}
            variant="icon"
          />
          <BrandMark
            className="hidden h-9 w-auto text-foreground md:block"
            src={branding.logo}
            variant="logo"
          />
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
