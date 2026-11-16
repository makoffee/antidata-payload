import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { BrandMark } from '@/components/Logo/BrandMark'
import { getBranding } from '@/utilities/getBranding'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const branding = await getBranding()
  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto bg-black dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link aria-label="antidata.net home" className="flex items-center gap-4" href="/">
          <BrandMark className="size-10 shrink-0 text-white" src={branding.icon} variant="icon" />
          {/* Same line as the homepage hero's supporting text */}
          <p className="text-sm text-white/70">
            <b className="font-semibold text-white">antidata.net</b> – a UX and product design
            portfolio.
          </p>
        </Link>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ link }, i) => {
              return <CMSLink className="text-white" key={i} {...link} />
            })}
          </nav>
        </div>
      </div>
    </footer>
  )
}
