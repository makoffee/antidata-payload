import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Project } from '../../../payload-types'

// Projects appear on their own page, the /portfolio index and in Projects blocks on any page,
// so refresh all of them when one changes.
const revalidateProjectPaths = (slug?: string | null) => {
  if (slug) revalidatePath(`/portfolio/${slug}`)
  revalidatePath('/portfolio')
  revalidatePath('/', 'layout')
  revalidateTag('portfolio-sitemap', 'max')
}

export const revalidateProject: CollectionAfterChangeHook<Project> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      payload.logger.info(`Revalidating project at path: /portfolio/${doc.slug}`)
      revalidateProjectPaths(doc.slug)
    }

    // If the project was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      payload.logger.info(`Revalidating old project at path: /portfolio/${previousDoc.slug}`)
      revalidateProjectPaths(previousDoc.slug)
    }
  }
  return doc
}

export const revalidateProjectDelete: CollectionAfterDeleteHook<Project> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    revalidateProjectPaths(doc?.slug)
  }

  return doc
}
