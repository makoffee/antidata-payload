import { getClientSideURL } from '@/utilities/getURL'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?${cacheTag}` : url
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
