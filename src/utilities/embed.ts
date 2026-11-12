/**
 * Turns a Figma share link (www.figma.com/proto/…, /design/…, /file/…) into its embed form
 * (embed.figma.com/…). Figma requires an `embed-host` param on embeds. Returns null for
 * anything that isn't a Figma link.
 */
export const toFigmaEmbedUrl = (input: string): string | null => {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }

  if (!/(^|\.)figma\.com$/.test(url.hostname)) return null

  // Older share links put the real link in ?url=
  if (url.pathname === '/embed' && url.searchParams.get('url')) {
    return toFigmaEmbedUrl(url.searchParams.get('url')!)
  }

  if (url.hostname !== 'embed.figma.com') {
    if (!/^\/(proto|design|file|board|slides)\//.test(url.pathname)) return null
    url.hostname = 'embed.figma.com'
  }

  if (!url.searchParams.has('embed-host')) url.searchParams.set('embed-host', 'antidata')
  return url.toString()
}

/**
 * Checks whether a site lets other sites show it in an iframe. Many sites forbid it with
 * X-Frame-Options or CSP frame-ancestors, and the browser then shows an empty box, so we check
 * up front and fall back to the cover image instead. The result is cached for an hour.
 */
export const canEmbed = async (src: string): Promise<boolean> => {
  try {
    const res = await fetch(src, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 3600 },
    })
    // Headers are all we need
    res.body?.cancel().catch(() => {})

    const xfo = res.headers.get('x-frame-options')?.toLowerCase()
    if (xfo && (xfo.includes('deny') || xfo.includes('sameorigin'))) return false

    const csp = res.headers.get('content-security-policy')?.toLowerCase() ?? ''
    const ancestors = csp
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith('frame-ancestors'))
    if (ancestors) {
      const sources = ancestors.split(/\s+/).slice(1)
      if (!sources.includes('*') && !sources.some((s) => s.includes('antidata.net'))) return false
    }

    return true
  } catch {
    // Couldn't reach it: let the browser try rather than hiding the preview
    return true
  }
}
