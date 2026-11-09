import type { Post, Project, ArchiveBlock as ArchiveBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'
import { ProjectGrid } from '@/components/ProjectGrid'
import { ProjectStories } from '@/components/ProjectStories'
import { Button } from '@/components/ui/button'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = async (props) => {
  const {
    id,
    categories,
    introContent,
    limit: limitFromProps,
    populateBy,
    projectLayout,
    relationTo,
    selectedDocs,
    showViewAll,
  } = props

  const limit = limitFromProps || 3

  let posts: Post[] = []
  let projects: Project[] = []

  if (populateBy === 'collection') {
    const payload = await getPayload({ config: configPromise })

    const flattenedCategories = categories?.map((category) => {
      if (typeof category === 'object') return category.id
      else return category
    })

    const where =
      flattenedCategories && flattenedCategories.length > 0
        ? { categories: { in: flattenedCategories } }
        : undefined

    if (relationTo === 'projects') {
      // Projects follow the drag-and-drop order from the admin
      const fetchedProjects = await payload.find({
        collection: 'projects',
        depth: 1,
        limit,
        overrideAccess: false,
        where,
      })

      projects = fetchedProjects.docs
    } else {
      const fetchedPosts = await payload.find({
        collection: 'posts',
        depth: 1,
        limit,
        where,
      })

      posts = fetchedPosts.docs
    }
  } else if (selectedDocs?.length) {
    for (const doc of selectedDocs) {
      if (typeof doc.value !== 'object') continue
      if (doc.relationTo === 'projects') projects.push(doc.value as Project)
      else posts.push(doc.value as Post)
    }
  }

  return (
    <div className="my-16 pb-12 md:pb-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      {projects.length > 0 && (
        <div className="container">
          {projectLayout === 'stories' ? (
            <ProjectStories projects={projects} />
          ) : (
            <ProjectGrid projects={projects} />
          )}
          {showViewAll && (
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg" variant="outline">
                <Link href="/portfolio">
                  View all projects
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
      {posts.length > 0 && <CollectionArchive posts={posts} />}
    </div>
  )
}
