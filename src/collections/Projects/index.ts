import { autoFillSeo } from '@/utilities/seoDefaults'
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
    description: 'Case studies. Drag rows to reorder.',
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
                description: 'One or two sentences, shown on cards and under the title.',
              },
              maxLength: 280,
            },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description: 'Main project image, used on the page and on cards.',
              },
            },
            {
              name: 'storyImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Story card image',
              admin: {
                description:
                  'Optional 9:16 image for story cards. Defaults to a crop of the cover.',
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
          name: 'screens',
          label: 'Screens',
          description: 'Optional screens shown side by side after the case study.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'heading',
                  type: 'text',
                  admin: { placeholder: 'Wireframes' },
                },
                {
                  name: 'backgroundImage',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Banner background',
                  admin: {
                    description: 'Optional. Dark or abstract images work best.',
                  },
                },
              ],
            },
            {
              name: 'text',
              type: 'textarea',
              label: 'Supporting text',
            },
            {
              name: 'items',
              type: 'array',
              label: 'Screens',
              labels: { singular: 'Screen', plural: 'Screens' },
              maxRows: 4,
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    { name: 'image', type: 'upload', relationTo: 'media', required: true },
                  ],
                },
              ],
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
                description: 'Shown after the case study. Use half width to pair images.',
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
          description: 'Interactive preview with a desktop and mobile toggle.',
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
                description: 'Use Figma if the live site is offline or has changed.',
              },
            },
            {
              name: 'liveUrl',
              type: 'text',
              label: 'Live preview URL',
              admin: {
                placeholder: 'https://',
                description: 'Defaults to the live project URL. Some sites block embedding.',
              },
            },
            {
              name: 'figmaUrl',
              type: 'text',
              label: 'Figma URL',
              admin: {
                placeholder: 'https://www.figma.com/proto/…',
                description:
                  'Share link to a prototype or design file. Must be viewable by anyone with the link.',
              },
              validate: (value: string | null | undefined) =>
                !value || /^https:\/\/([\w-]+\.)?figma\.com\//.test(value)
                  ? true
                  : 'Must be a figma.com link',
            },
            {
              name: 'title',
              type: 'text',
              admin: { placeholder: 'The Experience' },
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
                description: 'Press Enter after each.',
              },
            },
            {
              name: 'skills',
              type: 'text',
              hasMany: true,
              admin: {
                description: 'Shown as tags at the end of the case study. Press Enter after each.',
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
        description: 'Available to Projects blocks.',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        description: 'Used for filtering.',
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
    beforeChange: [populatePublishedAt, autoFillSeo('projects')],
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
