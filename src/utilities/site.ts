import type { CollectionSlug } from 'payload'

// Site-wide identity used for <title>, Open Graph and SEO defaults. Edit here to rebrand.
export const SITE_NAME = 'Antidata.net – Matt Coffee'
export const SITE_DESCRIPTION = 'Matt Coffee | Design Studio Berlin. A design portfolio, est 2001.'

// Public URL prefix for each routable collection. Keep in sync with the folders in src/app/(frontend).
export const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  pages: '',
  posts: '/posts',
  projects: '/portfolio',
}

export const getDocPath = (collection: CollectionSlug, slug: string) =>
  `${collectionPrefixMap[collection] ?? `/${collection}`}/${slug}`
