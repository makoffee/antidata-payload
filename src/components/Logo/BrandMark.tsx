import React from 'react'

import { Logo, LogoIcon } from './Logo'

type Props = {
  className?: string
  /** Uploaded file from Site settings → Appearance → Logo / Icon. Empty = built-in artwork */
  src?: string | null
  style?: React.CSSProperties
  variant: 'logo' | 'icon'
}

// One place for the brand artwork, used by the site header/footer and the admin.
// The built-in SVG is inline and takes the text colour. An uploaded file is used as a mask
// over currentColor, so any SVG or transparent PNG follows light/dark mode the same way.
// The hidden <img> only gives the box its natural size.
export const BrandMark: React.FC<Props> = ({ className, src, style, variant }) => {
  if (!src) {
    const Fallback = variant === 'logo' ? Logo : LogoIcon
    return <Fallback className={className} style={style} />
  }

  const mask = `url(${src}) center / contain no-repeat`
  return (
    <span
      aria-label="antidata"
      className={className}
      role="img"
      style={{
        background: 'currentColor',
        display: 'inline-block',
        lineHeight: 0,
        mask,
        WebkitMask: mask,
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={src}
        style={{ display: 'block', height: '100%', visibility: 'hidden', width: '100%' }}
      />
    </span>
  )
}
