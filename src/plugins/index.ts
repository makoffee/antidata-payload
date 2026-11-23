import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { seoDescriptionFor, seoTitleFor, type SeoCollection } from '@/utilities/seoDefaults'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateDescription, GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post, Project } from '@/payload-types'
import { guardContactEmails } from '@/utilities/contactEmailGuard'
import { getServerSideURL } from '@/utilities/getURL'
import { getDocPath } from '@/utilities/site'

// The Auto-generate buttons in the SEO tab use the same rules as the automatic filling on save
const generateTitle: GenerateTitle<Post | Page | Project> = ({ doc, collectionSlug }) =>
  seoTitleFor((collectionSlug as SeoCollection) ?? 'pages', doc)

const generateDescription: GenerateDescription<Post | Page | Project> = ({
  doc,
  collectionSlug,
}) => seoDescriptionFor((collectionSlug as SeoCollection) ?? 'pages', doc)

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
    // Submissions are created only by /next/contact (validated, rate limited, bot-checked).
    // The plugin's default lets anyone on the internet POST to /api/form-submissions.
    formSubmissionOverrides: {
      access: {
        create: () => false,
      },
    },
    beforeEmail: guardContactEmails,
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
