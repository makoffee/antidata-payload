import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
  OrderedListFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateProject, revalidateProjectDelete } from './hooks/revalidateProject'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

export const Projects: CollectionConfig<'projects'> = {
  slug: 'projects',
  labels: {
    singular: 'Project',
    plural: 'Projects',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // Fields populated when a project is referenced (cards, grids, related projects)
  defaultPopulate: {
    title: true,
    slug: true,
    summary: true,
    coverImage: true,
    client: true,
    year: true,
    categories: true,
  },
  // Drag-and-drop ordering in the admin list view; the site lists projects in this order
  orderable: true,
  admin: {
    group: 'Portfolio',
    defaultColumns: ['title', 'client', 'year', 'featured', '_status', 'updatedAt'],
    description: 'Portfolio case studies. Drag rows to change the order they appear on the site.',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'projects',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'projects',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              name: 'summary',
              type: 'textarea',
              admin: {
                description: 'One or two sentences. Shown on project cards and under the title.',
              },
              maxLength: 280,
            },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description: 'Used on the project page and on cards across the site.',
              },
            },
            {
              name: 'storyImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Story card image (optional)',
              admin: {
                description:
                  'A tall 9:16 image (e.g. 1080×1920) for the homepage story cards. Without one, the card crops the cover image to fit.',
              },
            },
            {
              name: 'content',
              type: 'richText',
              label: 'Case study',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
                    UnorderedListFeature(),
                    OrderedListFeature(),
                    BlocksFeature({ blocks: [MediaBlock] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
            },
          ],
        },
        {
          label: 'Gallery',
          fields: [
            {
              name: 'gallery',
              type: 'array',
              labels: {
                singular: 'Image',
                plural: 'Images',
              },
              admin: {
                description: 'Shown after the case study. Use "Half width" to place images side by side.',
                initCollapsed: true,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'media',
                      required: true,
                    },
                    {
                      name: 'size',
                      type: 'select',
                      defaultValue: 'full',
                      options: [
                        { label: 'Full width', value: 'full' },
                        { label: 'Half width', value: 'half' },
                      ],
                    },
                  ],
                },
                {
                  name: 'caption',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          name: 'experience',
          label: 'Experience',
          description:
            'An interactive preview of the finished work, with a desktop/mobile toggle. Shown after the case study when the chosen source has a URL.',
          fields: [
            {
              name: 'source',
              type: 'radio',
              defaultValue: 'live',
              options: [
                { label: 'Live site', value: 'live' },
                { label: 'Figma prototype', value: 'figma' },
              ],
              admin: {
                layout: 'horizontal',
                description:
                  'Switch to Figma when the live site no longer matches the design (or is offline).',
              },
            },
            {
              name: 'liveUrl',
              type: 'text',
              label: 'Live preview URL',
              admin: {
                placeholder: 'https://',
                description:
                  'Leave empty to use the "Live project URL" from Details. Some sites (e.g. the App Store) refuse to be embedded; the preview then uses the Figma URL, or is left out.',
              },
            },
            {
              name: 'figmaUrl',
              type: 'text',
              label: 'Figma URL',
              admin: {
                placeholder: 'https://www.figma.com/proto/…',
                description:
                  'Paste the Share link of a prototype (or design file). The file must be viewable by anyone with the link.',
              },
              validate: (value: string | null | undefined) =>
                !value || /^https:\/\/([\w-]+\.)?figma\.com\//.test(value)
                  ? true
                  : 'Must be a figma.com link',
            },
            {
              name: 'title',
              type: 'text',
              admin: { placeholder: 'Experience it' },
            },
            {
              name: 'description',
              type: 'textarea',
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'client',
                  type: 'text',
                },
                {
                  name: 'year',
                  type: 'number',
                  min: 1990,
                  max: 2100,
                },
              ],
            },
            {
              name: 'services',
              type: 'text',
              hasMany: true,
              admin: {
                description: 'e.g. Branding, Web design, Art direction. Press Enter after each.',
              },
            },
            {
              name: 'skills',
              type: 'text',
              hasMany: true,
              admin: {
                description:
                  'Skills as listed for this project on LinkedIn. Shown as tags at the end of the case study (keeps the wording consistent for recruiters and ATS). Press Enter after each.',
              },
            },
            {
              name: 'projectUrl',
              type: 'text',
              label: 'Live project URL',
              admin: {
                placeholder: 'https://',
              },
            },
            {
              name: 'credits',
              type: 'array',
              admin: {
                description: 'Collaborators and their roles.',
                initCollapsed: true,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'role', type: 'text', required: true },
                    { name: 'name', type: 'text', required: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Featured projects can be shown on the homepage with a Projects block.',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        description: 'Used for the filters on the Portfolio page.',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'relatedProjects',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      filterOptions: ({ id }) => {
        return {
          id: {
            not_in: [id],
          },
        }
      },
      hasMany: true,
      relationTo: 'projects',
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidateProject],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateProjectDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
