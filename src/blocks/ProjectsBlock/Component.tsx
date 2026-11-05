import type { Project, ProjectsBlock as ProjectsBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { ProjectGrid } from '@/components/ProjectGrid'

export const ProjectsBlockComponent: React.FC<
  ProjectsBlockProps & {
    id?: string
  }
> = async (props) => {
  const { id, introContent, limit: limitFromProps, populateBy, selectedProjects, showViewAll } =
    props

  let projects: Project[] = []

  if (populateBy === 'selection') {
    projects = (selectedProjects || []).filter(
      (project): project is Project => typeof project === 'object',
    )
  } else {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'projects',
      depth: 1,
      limit: limitFromProps || 6,
      overrideAccess: false,
      ...(populateBy === 'featured' ? { where: { featured: { equals: true } } } : {}),
    })

    projects = result.docs
  }

  return (
    <div className="container" id={`block-${id}`}>
      {introContent && (
        <RichText className="ms-0 max-w-[48rem] mb-12" data={introContent} enableGutter={false} />
      )}
      <ProjectGrid projects={projects} />
      {showViewAll && (
        <div className="mt-12">
          <Link className="text-lg underline underline-offset-4 hover:no-underline" href="/portfolio">
            View full portfolio →
          </Link>
        </div>
      )}
    </div>
  )
}
