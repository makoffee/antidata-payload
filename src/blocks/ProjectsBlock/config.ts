import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const ProjectsBlock: Block = {
  slug: 'projectsBlock',
  interfaceName: 'ProjectsBlock',
  labels: {
    singular: 'Projects',
    plural: 'Projects',
  },
  fields: [
    {
      name: 'introContent',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: 'Intro',
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'featured',
      options: [
        { label: 'Featured projects', value: 'featured' },
        { label: 'Latest projects', value: 'all' },
        { label: 'Selection', value: 'selection' },
      ],
    },
    {
      name: 'selectedProjects',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'selection',
      },
      hasMany: true,
      relationTo: 'projects',
    },
    {
      name: 'limit',
      type: 'number',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy !== 'selection',
        step: 1,
      },
      defaultValue: 6,
    },
    {
      name: 'showViewAll',
      type: 'checkbox',
      label: 'Show "View all" link',
      defaultValue: true,
    },
  ],
}
