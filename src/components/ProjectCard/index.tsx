import Link from 'next/link'
import React from 'react'

import type { Project } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

export type ProjectCardData = Pick<
  Project,
  'slug' | 'title' | 'summary' | 'coverImage' | 'client' | 'year'
>

export const ProjectCard: React.FC<{
  className?: string
  project: ProjectCardData
  priority?: boolean
}> = ({ className, project, priority }) => {
  const { slug, title, summary, coverImage, client, year } = project
  const meta = [client, year].filter(Boolean).join(' · ')

  return (
    <Link className={cn('group block', className)} href={`/portfolio/${slug}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {coverImage && typeof coverImage === 'object' && (
          <Media
            fill
            imgClassName="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            priority={priority}
            resource={coverImage}
            size="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
      </div>
      <h3 className="mt-4 text-xl font-medium group-hover:underline underline-offset-4">{title}</h3>
      {meta && <p className="mt-1 text-sm text-muted-foreground">{meta}</p>}
      {summary && <p className="mt-2 text-muted-foreground line-clamp-2">{summary}</p>}
    </Link>
  )
}
