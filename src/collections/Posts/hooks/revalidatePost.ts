import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'
import { getDocPath } from '../../../utilities/site'

// The blog index, its pages and any page with a Posts block list posts, so refresh the whole
// site when a post changes (pages are static and only rebuild on publish).
const revalidateListings = () => {
  revalidatePath('/', 'layout')
}

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = getDocPath('posts', doc.slug || '')

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePath(path)
      revalidateListings()
      revalidateTag('posts-sitemap', 'max')
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = getDocPath('posts', previousDoc.slug || '')

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateListings()
      revalidateTag('posts-sitemap', 'max')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = getDocPath('posts', doc?.slug || '')

    revalidatePath(path)
    revalidateListings()
    revalidateTag('posts-sitemap', 'max')
  }

  return doc
}
