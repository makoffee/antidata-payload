import { getClientSideURL } from '@/utilities/getURL'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
// Media files are committed to public/media and served by Vercel's CDN as static files at
// /media/<name>. Payload still stores and returns /api/media/file/<name> in the database; this
// turns that into the static path. (/api is closed on the live site, so the stored path would 404.)
const MEDIA_ROUTE = '/api/media/file/'
const STATIC_MEDIA = '/media/'

// The database can hold a filename in decomposed Unicode (e + combining accent) while the file in
// git is precomposed (é), and the CDN matches bytes exactly, so the request 404s. Normalize to NFC.
const normalizeName = (encoded: string): string => {
  try {
    return encodeURIComponent(decodeURIComponent(encoded).normalize('NFC'))
  } catch {
    return encoded
  }
}

export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  // Payload media path -> static file (the path segment is already URL-encoded)
  if (url.startsWith(MEDIA_ROUTE)) {
    const local = `${STATIC_MEDIA}${normalizeName(url.slice(MEDIA_ROUTE.length))}`
    return cacheTag ? `${local}?${cacheTag}` : local
  }

  // Other relative paths stay relative. Prepending a domain made the server (Vercel's production
  // URL) and the browser (window.location) disagree after a domain change, and Next's optimizer
  // then rejected the browser's version, so images vanished on hydration.
  if (url.startsWith('/')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  const baseUrl = getClientSideURL()
  return cacheTag ? `${baseUrl}${url}?${cacheTag}` : `${baseUrl}${url}`
}
