import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateDescription, GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post, Project } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { getDocPath, SITE_NAME } from '@/utilities/site'

// Plain text of the first rich-text node matching `test` (used to read the hero)
type Node = { type?: string; tag?: string; text?: string; children?: Node[] }
const textOf = (n: Node): string => n.text ?? (n.children || []).map(textOf).join('')
const findText = (root: Node | undefined, test: (n: Node) => boolean): string => {
  const hit = root?.children?.find(test)
  return hit ? textOf(hit).trim() : ''
}
const heroParts = (doc: Partial<Page> | undefined) => {
  const root = (doc?.hero?.richText as { root?: Node } | null | undefined)?.root
  return {
    heading: findText(root, (n) => n.type === 'heading' && n.tag === 'h1'),
    subline: findText(root, (n) => n.type === 'paragraph'),
    keywords: doc?.hero?.keywords || [],
  }
}

// Pages with a hero mirror it in search results: title = hero heading, description = subline
// plus keyword chips. Everything else falls back to "Title | Site name".
const generateTitle: GenerateTitle<Post | Page | Project> = ({ doc, collectionSlug }) => {
  const { heading } = collectionSlug === 'pages' ? heroParts(doc as Partial<Page>) : { heading: '' }
  if (heading) return `${heading} – antidata.net`
  return doc?.title ? `${doc.title} | ${SITE_NAME}` : SITE_NAME
}

const generateDescription: GenerateDescription<Post | Page | Project> = ({
  doc,
  collectionSlug,
}) => {
  if (collectionSlug === 'pages') {
    const { subline, keywords } = heroParts(doc as Partial<Page>)
    if (subline) return [subline, keywords.join(', ')].filter(Boolean).join(' ')
  }
  return (doc as Partial<Project>)?.summary || ''
}

const generateURL: GenerateURL<Post | Page | Project> = ({ doc, collectionSlug }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}${getDocPath(collectionSlug ?? 'pages', doc.slug)}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts', 'projects'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateDescription,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
]
