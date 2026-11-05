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
        description:
          'SVG works best; transparent PNG is fine. Drag to reorder. Logos are shown in greyscale until hovered.',
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
                description: 'Brand name, used as the image’s alt text.',
              },
            },
          ],
        },
        {
          name: 'url',
          type: 'text',
          label: 'Link (optional)',
          admin: {
            placeholder: 'https://',
          },
        },
      ],
    },
    {
      name: 'monochrome',
      type: 'checkbox',
      label: 'Show logos in greyscale (full colour on hover)',
      defaultValue: true,
    },
  ],
}
