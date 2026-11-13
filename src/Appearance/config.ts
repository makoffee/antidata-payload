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
      label: 'Section background style',
      defaultValue: 'parallax',
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Fixed', value: 'fixed' },
        { label: 'Parallax', value: 'parallax' },
      ],
      admin: {
        layout: 'horizontal',
        description:
          'How background images behave behind card sections (e.g. Design Expertise, Wireframes). Cover: scrolls with the section. Fixed: stays still while the cards scroll over it. Parallax: drifts slowly as you scroll.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateAppearance],
  },
}
