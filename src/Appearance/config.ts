import type { GlobalConfig } from 'payload'

import { revalidateAppearance } from './hooks/revalidateAppearance'

export const Appearance: GlobalConfig = {
  slug: 'appearance',
  admin: {
    group: 'Site settings',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'backgroundStyle',
      type: 'radio',
      label: 'Background style',
      defaultValue: 'parallax',
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Fixed', value: 'fixed' },
        { label: 'Parallax', value: 'parallax' },
      ],
      admin: {
        layout: 'horizontal',
        description: 'Behaviour of section background images on scroll.',
      },
    },
    {
      name: 'adminBranding',
      type: 'group',
      label: 'Design and branding',
      admin: {
        description:
          'Single-colour SVG or transparent PNG artwork works best: it adapts to light and dark mode.',
      },
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo',
          admin: { description: 'Wide wordmark. SVG or transparent PNG.' },
        },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          label: 'Icon',
          admin: { description: 'Square mark. Also used as the browser tab icon.' },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateAppearance],
  },
}
