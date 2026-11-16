import type { Block } from 'payload'

export const LogoWall: Block = {
  slug: 'logoWall',
  interfaceName: 'LogoWallBlock',
  labels: {
    singular: 'Logo wall',
    plural: 'Logo walls',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Brands I’ve worked with',
    },
    {
      name: 'text',
      type: 'textarea',
      label: 'Supporting text',
    },
    {
      name: 'logos',
      type: 'array',
      labels: {
        singular: 'Logo',
        plural: 'Logos',
      },
      admin: {
        description: 'SVG or transparent PNG. Drag to reorder.',
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                description: 'Used as the alt text.',
              },
            },
          ],
        },
        {
          name: 'logoDark',
          type: 'upload',
          relationTo: 'media',
          label: 'Dark mode logo',
          admin: {
            description: 'Light version for dark mode. Optional.',
          },
        },
        {
          name: 'url',
          type: 'text',
          label: 'Link',
          admin: {
            placeholder: 'https://',
          },
        },
      ],
    },
    {
      name: 'monochrome',
      type: 'checkbox',
      label: 'Greyscale until hover',
      defaultValue: true,
    },
  ],
}
