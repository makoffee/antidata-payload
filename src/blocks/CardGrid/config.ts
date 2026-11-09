import type { Block } from 'payload'

import { cardIcons } from './icons'

export const CardGrid: Block = {
  slug: 'cardGrid',
  interfaceName: 'CardGridBlock',
  labels: {
    singular: 'Cards',
    plural: 'Cards',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'text',
      type: 'textarea',
      label: 'Supporting text',
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Background image (optional)',
      admin: {
        description:
          'Turns the section into a full-width banner with frosted-glass cards. Abstract or dark images work best.',
      },
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      admin: {
        description: 'Cards per row on desktop.',
      },
      options: [
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
      ],
    },
    {
      name: 'cards',
      type: 'array',
      labels: {
        singular: 'Card',
        plural: 'Cards',
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'icon',
              type: 'select',
              options: Object.entries(cardIcons).map(([value, { label }]) => ({ label, value })),
            },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'url',
          type: 'text',
          label: 'Link (optional)',
          admin: {
            description: 'e.g. /portfolio or https://… Makes the whole card clickable.',
          },
        },
      ],
    },
  ],
}
