import { getClientSideURL } from '@/utilities/getURL'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
// When set (e.g. https://<store>.public.blob.vercel-storage.com), Payload media paths become direct
// public Blob URLs: the browser and Next's image optimizer read Blob's own CDN, which only counts a
// Blob operation on a cache miss. Without it, images go through Payload's /api/media/file route
// (2 Blob operations per request that reaches it) or, locally, the files in public/media. The value is
// inlined at build time, so the server and the browser always agree. Unset locally on purpose.
const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_BASE_URL?.replace(/\/$/, '')
const MEDIA_ROUTE = '/api/media/file/'

export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  // Payload media path -> direct Blob URL (the path segment is already URL-encoded, and the Blob
  // key is the same filename)
  if (BLOB_BASE_URL && url.startsWith(MEDIA_ROUTE)) {
    const direct = `${BLOB_BASE_URL}/${url.slice(MEDIA_ROUTE.length)}`
    return cacheTag ? `${direct}?${cacheTag}` : direct
  }

  // Keep Payload's own paths (/api/media/file/...) relative. Prepending a domain made the server
  // (Vercel's production URL) and the browser (window.location) disagree after a domain change,
  // and Next's optimizer then rejected the browser's version, so images vanished on hydration.
  // Relative paths are the same everywhere and need no remotePatterns entry.
  if (url.startsWith('/')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  const baseUrl = getClientSideURL()
  return cacheTag ? `${baseUrl}${url}?${cacheTag}` : `${baseUrl}${url}`
}
