import type { Appearance } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { getMediaUrl } from '@/utilities/getMediaUrl'

const urlOf = (media: unknown): string | null =>
  media && typeof media === 'object' && 'url' in media && typeof media.url === 'string'
    ? getMediaUrl(media.url)
    : null

// Logo and icon uploaded in Site settings → Appearance (null = use the built-in artwork)
export async function getBranding(): Promise<{ icon: string | null; logo: string | null }> {
  try {
    const appearance = (await getCachedGlobal('appearance', 1)()) as Appearance
    return {
      icon: urlOf(appearance?.adminBranding?.icon),
      logo: urlOf(appearance?.adminBranding?.logo),
    }
  } catch {
    // e.g. the columns don't exist yet (migration not run)
    return { icon: null, logo: null }
  }
}
