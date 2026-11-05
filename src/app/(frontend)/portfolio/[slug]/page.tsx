import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

import type { Project } from '@/payload-types'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import { ProjectGallery } from '@/components/ProjectGallery'
import { ProjectGrid } from '@/components/ProjectGrid'
import { ProjectHero } from '@/heros/ProjectHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'

// Re-check the database every 60s so edits made from any admin (local or live) show up on the live site
export const revalidate = 60

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const projects = await payload.find({
    collection: 'projects',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return projects.docs.map(({ slug }) => ({ slug }))
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function ProjectPage({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/portfolio/' + decodedSlug
  const project = await queryProjectBySlug({ slug: decodedSlug })

  if (!project) return <PayloadRedirects url={url} />

  const next = await queryNextProject({ id: project.id })
  const related = (project.relatedProjects || []).filter(
    (item): item is Project => typeof item === 'object',
  )

  return (
    <article className="pt-24 pb-24">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <ProjectHero project={project} />

      {project.content && (
        <div className="container mt-16">
          <RichText className="max-w-[48rem] mx-auto" data={project.content} enableGutter={false} />
        </div>
      )}

      {project.gallery && project.gallery.length > 0 && (
        <div className="container mt-16">
          <ProjectGallery gallery={project.gallery} />
        </div>
      )}

      {project.credits && project.credits.length > 0 && (
        <div className="container mt-16">
          <dl className="max-w-[48rem] mx-auto grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 border-t border-border pt-6">
            {project.credits.map(({ id, role, name }) => (
              <React.Fragment key={id}>
                <dt className="text-muted-foreground">{role}</dt>
                <dd>{name}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      )}

      {related.length > 0 && (
        <section className="container mt-24">
          <h2 className="mb-8 text-2xl font-medium">Related projects</h2>
          <ProjectGrid projects={related} />
        </section>
      )}

      {next && (
        <nav className="container mt-24 border-t border-border pt-10" aria-label="Next project">
          <Link className="group block" href={`/portfolio/${next.slug}`}>
            <span className="text-sm text-muted-foreground">Next project</span>
            <span className="mt-2 block text-3xl md:text-5xl font-medium tracking-tight group-hover:underline underline-offset-8">
              {next.title} →
            </span>
          </Link>
        </nav>
      )}
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const project = await queryProjectBySlug({ slug: decodedSlug })

  return generateMeta({ doc: project, path: `/portfolio/${decodedSlug}` })
}

const queryProjectBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'projects',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

// The project after this one in the admin's drag-and-drop order, wrapping around to the first
const queryNextProject = async ({ id }: { id: Project['id'] }) => {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'projects',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: { title: true, slug: true },
  })

  if (docs.length < 2) return null

  const index = docs.findIndex((doc) => doc.id === id)
  return docs[(index + 1) % docs.length]
}
