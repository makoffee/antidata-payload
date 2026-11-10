'use client'

import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import NextImage from 'next/image'
import React from 'react'

import type { Props as MediaProps } from '../types'

import { cssVariables } from '@/cssVariables'
import { getMediaUrl } from '@/utilities/getMediaUrl'

const { breakpoints } = cssVariables

/**
 * ImageMedia
 *
 * This component passes a **relative** `src` (e.g. `/api/media/file/image-123.jpg?<updatedAt>`)
 * to Next.js Image, which optimizes local paths without any remotePatterns entry. Keeping it
 * relative means the server and the browser always produce the same URL, whatever the domain.
 *
 * If your storage/plugin returns **external CDN URLs** (e.g. `https://cdn.example.com/...`),
 * choose ONE of the following:
 *   A) Allow the remote host in next.config.js:
 *      images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }] }
 *   B) Provide a **custom loader** for CDN-specific transforms:
 *      const imageLoader: ImageLoader = ({ src, width, quality }) =>
 *        `https://cdn.example.com${src}?w=${width}&q=${quality ?? 75}`
 *      <Image loader={imageLoader} src="/media/hero.jpg" width={1200} height={600} alt="" />
 *   C) Skip optimization:
 *      <Image unoptimized src="https://cdn.example.com/hero.jpg" width={1200} height={600} alt="" />
 *
 * Only add `loader` if using external CDNs with custom transforms.
 */

export const ImageMedia: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill,
    pictureClassName,
    imgClassName,
    priority,
    resource,
    size: sizeFromProps,
    src: srcFromProps,
    loading: loadingFromProps,
  } = props

  let width: number | undefined
  let height: number | undefined
  let alt = altFromProps
  let src: StaticImageData | string = srcFromProps || ''
  let isSvg = false

  if (!src && resource && typeof resource === 'object') {
    const { alt: altFromResource, height: fullHeight, url, width: fullWidth } = resource

    width = fullWidth!
    height = fullHeight!
    alt = altFromResource || ''

    // Next's image optimizer rejects SVG, so vector uploads are served as-is
    isSvg = resource.mimeType === 'image/svg+xml'
    // Some SVGs have no intrinsic size; give NextImage a default so it can still render
    if (isSvg) {
      width = width || 1200
      height = height || 800
    }

    const cacheTag = resource.updatedAt

    src = getMediaUrl(url, cacheTag)
  }

  const loading = loadingFromProps || (!priority ? 'lazy' : undefined)

  // Photos ease from a soft blur into focus once loaded (cached images skip straight to sharp)
  const imgRef = React.useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = React.useState(false)
  React.useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [])
  const blurUp = !isSvg

  // NOTE: this is used by the browser to determine which image to download at different screen sizes
  const sizes = sizeFromProps
    ? sizeFromProps
    : Object.entries(breakpoints)
        .map(([, value]) => `(max-width: ${value}px) ${value * 2}w`)
        .join(', ')

  return (
    // With `fill` the <picture> wrapper must be positioned too, or Next warns about the img's parent
    <picture className={cn(fill && 'absolute inset-0', pictureClassName)}>
      <NextImage
        alt={alt || ''}
        className={cn(
          imgClassName,
          blurUp &&
            '[transition:opacity_.7s_ease-out,filter_.7s_ease-out,transform_.7s_ease-out,scale_.7s_ease-out,translate_.7s_ease-out]',
          blurUp && !loaded && 'opacity-0 motion-safe:blur-lg',
        )}
        fill={fill}
        height={!fill ? height : undefined}
        onLoad={() => setLoaded(true)}
        placeholder="empty"
        ref={imgRef}
        priority={priority}
        quality={100}
        loading={loading}
        sizes={sizes}
        src={src}
        unoptimized={isSvg}
        width={!fill ? width : undefined}
      />
    </picture>
  )
}
