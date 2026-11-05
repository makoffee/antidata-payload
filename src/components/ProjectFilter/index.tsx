'use client'

import React, { useMemo, useState } from 'react'

import type { Category, Project } from '@/payload-types'

import type { ProjectCardData } from '@/components/ProjectCard'
import { ProjectGrid } from '@/components/ProjectGrid'
import { cn } from '@/utilities/ui'

// Client-side category filter for the /portfolio page. Portfolios are small, so filtering
// in the browser keeps the page fully static and instant to switch.
export type FilterableProject = ProjectCardData & Pick<Project, 'id' | 'categories'>

export const ProjectFilter: React.FC<{ projects: FilterableProject[] }> = ({ projects }) => {
  const [active, setActive] = useState<string | null>(null)

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    for (const project of projects) {
      for (const category of project.categories || []) {
        if (typeof category === 'object' && category?.slug) {
          map.set(category.slug, (category as Category).title)
        }
      }
    }
    return [...map.entries()]
  }, [projects])

  const visible = active
    ? projects.filter((project) =>
        project.categories?.some(
          (category) => typeof category === 'object' && category?.slug === active,
        ),
      )
    : projects

  return (
    <div>
      {categories.length > 0 && (
        <div className="mb-12 flex flex-wrap gap-2" role="toolbar" aria-label="Filter projects">
          {[[null, 'All'] as const, ...categories].map(([slug, title]) => (
            <button
              aria-pressed={active === slug}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition-colors',
                active === slug
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground',
              )}
              key={slug ?? 'all'}
              onClick={() => setActive(slug)}
              type="button"
            >
              {title}
            </button>
          ))}
        </div>
      )}
      <ProjectGrid projects={visible} />
    </div>
  )
}
