import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { Figtree, Manrope } from 'next/font/google'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { getBranding } from '@/utilities/getBranding'

// Figtree for headlines, Manrope for body, buttons, nav and everything else
const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const { icon } = await getBranding()

  return (
    <html
      className={cn(figtree.variable, manrope.variable, GeistMono.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        {icon ? (
          <link href={icon} rel="icon" />
        ) : (
          <>
            <link href="/favicon.ico" rel="icon" sizes="48x48" />
            <link href="/favicon.svg" rel="icon" type="image/svg+xml" sizes="any" />
            <link href="/icon-192.png" rel="icon" type="image/png" sizes="192x192" />
            <link href="/icon-512.png" rel="icon" type="image/png" sizes="512x512" />
            <link href="/apple-touch-icon.png" rel="apple-touch-icon" sizes="180x180" />
          </>
        )}
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
