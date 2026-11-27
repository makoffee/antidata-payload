import type { Metadata } from 'next'

import type { Media, Page, Post, Project, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { getMediaUrl } from './getMediaUrl'
import { defaultSeoTitle } from './seoDefaults'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/antidata-og.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url
    const raw = getMediaUrl(ogUrl || image.url || '')

    // Static media paths are relative; make them absolute for Open Graph
    url = /^https?:\/\//.test(raw) ? raw : serverUrl + raw
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | Partial<Project> | null
  path?: string
}): Promise<Metadata> => {
  const { doc, path } = args

  const ogImage = getImageURL(doc?.meta?.image)

  // meta.title is filled with "<title> | antidata.net" on save (and can be overridden); fall back to the same
  const title = doc?.meta?.title || defaultSeoTitle(doc?.title)

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: path || (doc?.slug && doc.slug !== 'home' ? `/${doc.slug}` : '/'),
    }),
    title,
  }
}
