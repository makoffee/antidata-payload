import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import { getBranding } from '@/utilities/getBranding'

import type { Header } from '@/payload-types'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()

  const branding = await getBranding()

  return <HeaderClient branding={branding} data={headerData} />
}
