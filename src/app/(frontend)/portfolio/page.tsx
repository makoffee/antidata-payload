import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { ProjectFilter } from '@/components/ProjectFilter'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { SITE_NAME } from '@/utilities/site'
import PageClient from './page.client'

export const dynamic = 'force-static'
export const revalidate = 60

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  // Sorted by the drag-and-drop order set in the admin (`orderable` on the collection)
  const projects = await payload.find({
    collection: 'projects',
    depth: 1,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    select: {
      title: true,
      slug: true,
      summary: true,
      coverImage: true,
      client: true,
      year: true,
      categories: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container">
        <h1 className="mb-12 text-4xl md:text-6xl font-medium tracking-tight">Portfolio</h1>
        <ProjectFilter projects={projects.docs} />
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  const title = `Portfolio | ${SITE_NAME}`
  return {
    title,
    openGraph: mergeOpenGraph({ title, url: '/portfolio' }),
  }
}
