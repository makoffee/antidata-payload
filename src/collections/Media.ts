import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Library',
  },
  folders: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Fallback when BLOB_READ_WRITE_TOKEN is unset. The Vercel Blob plugin
    // sets disableLocalStorage when the token is present, so files go to Blob.
    staticDir: path.resolve(dirname, '../../public/media'),
    // Local dev only (MEDIA_FALLBACK_ORIGIN set, no Blob token): the dev database lists production's
    // images, whose files live in Blob. When a file isn't on local disk, read it from the live site's
    // media route (CDN-cached, no Blob operations, read-only). Locally uploaded files win.
    handlers: process.env.MEDIA_FALLBACK_ORIGIN
      ? [
          (_req, { params }): Promise<Response> | void => {
            const { filename } = params
            if (fs.existsSync(path.resolve(dirname, '../../public/media', filename))) return undefined
            return fetch(
              `${process.env.MEDIA_FALLBACK_ORIGIN}/api/media/file/${encodeURIComponent(filename)}`,
            ).then(
              (res) =>
                new Response(res.ok ? res.body : null, {
                  status: res.status,
                  headers: {
                    'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
                    'Cache-Control': 'public, max-age=3600',
                  },
                }),
            )
          },
        ]
      : [],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
