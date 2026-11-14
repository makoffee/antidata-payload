import React from 'react'

import type { Page } from '@/payload-types'

import RichText from '@/components/RichText'

type LowImpactHeroType =
  | {
      children?: React.ReactNode
      richText?: never
    }
  | (Omit<Page['hero'], 'richText'> & {
      children?: never
      richText?: Page['hero']['richText']
    })

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ children, richText }) => {
  return (
    <div className="container mt-8 mb-8">
      <div className="max-w-[48rem]">
        {children || (richText && (
            <RichText
              className="prose-h1:mb-0 prose-h1:text-4xl md:prose-h1:text-6xl prose-h1:font-medium prose-h1:tracking-tight"
              data={richText}
              enableGutter={false}
            />
          ))}
      </div>
    </div>
  )
}
