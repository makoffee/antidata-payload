import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

import type { Project } from '@/payload-types'

import { ExperiencePreview } from '@/components/ExperiencePreview'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { ProjectGallery } from '@/components/ProjectGallery'
import { ProjectScreens } from '@/components/ProjectScreens'
import { ProjectGrid } from '@/components/ProjectGrid'
import { ProjectHero } from '@/heros/ProjectHero'
import { canEmbed, toFigmaEmbedUrl } from '@/utilities/embed'
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
  const experience = await resolveExperience(project)

  return (
    <article className="pt-24 pb-24">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <ProjectHero hasDemo={Boolean(experience)} project={project} />

      {project.content && (
        <div className="container mt-16">
          <RichText className="max-w-[48rem] mx-auto" data={project.content} enableGutter={false} />
        </div>
      )}

      {project.screens?.items?.length ? (
        <ProjectScreens className="mt-16" screens={project.screens} />
      ) : null}

      {experience && <ExperiencePreview className="mt-24" {...experience} />}

      {project.gallery && project.gallery.length > 0 && (
        <div className="container mt-16">
          <ProjectGallery gallery={project.gallery} />
        </div>
      )}

      {project.skills && project.skills.length > 0 && (
        <section className="container mt-16" aria-labelledby="project-skills">
          <div className="max-w-[48rem] mx-auto border-t border-border pt-6">
            <h2 className="text-sm text-muted-foreground" id="project-skills">
              Skills
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {project.skills.map((skill) => (
                <li
                  className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm"
                  key={skill}
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        </section>
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

// Builds the Experience section from the admin's Experience tab. Returns null (no section) when
// there's nothing to preview. The component prefers the chosen source and falls back to the other.
const resolveExperience = async (project: Project) => {
  const { source, liveUrl, figmaUrl, title, description } = project.experience ?? {}
  const siteUrl = liveUrl || project.projectUrl
  const live = siteUrl && /^https?:\/\//.test(siteUrl) ? siteUrl : null
  const figma = figmaUrl ? toFigmaEmbedUrl(figmaUrl) : null

  if (!live && !figma) return null

  const links = [
    live && { href: live, label: 'View live demo' },
    figma && figmaUrl && { href: figmaUrl, label: 'Open in Figma' },
  ].filter((link): link is { href: string; label: string } => Boolean(link))

  // Sites that refuse iframes (e.g. the App Store) fall back to Figma, or hide the section
  const usesLive = Boolean(live) && (source !== 'figma' || !figma)
  const liveEmbeddable = usesLive ? await canEmbed(live!) : true
  if (!liveEmbeddable && !figma) return null

  return {
    source: liveEmbeddable ? (source ?? 'live') : 'figma',
    liveUrl: liveEmbeddable ? live : null,
    // The browser bar shows the project's real address, even when the preview is a demo copy
    addressLabel: project.projectUrl || live,
    figmaUrl: figma,
    title,
    description,
    links,
  }
}

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
