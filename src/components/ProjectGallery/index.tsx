import React from 'react'

import { Reveal } from '@/components/Reveal'

import type { Project } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

export const ProjectGallery: React.FC<{
  className?: string
  gallery: Project['gallery']
}> = ({ className, gallery }) => {
  if (!gallery?.length) return null

  return (
    <div className={cn('grid gap-6 md:grid-cols-2', className)}>
      {gallery.map(({ id, image, size, caption }) => {
        if (!image || typeof image !== 'object') return null

        return (
          <Reveal className={cn(size !== 'half' && 'md:col-span-2')} key={id}>
            <figure>
              <Media
                imgClassName="w-full h-auto rounded-lg"
                resource={image}
                size={size === 'half' ? '(max-width: 768px) 100vw, 50vw' : '100vw'}
              />
              {caption && (
                <figcaption className="mt-3 text-sm text-muted-foreground">{caption}</figcaption>
              )}
            </figure>
          </Reveal>
        )
      })}
    </div>
  )
}
