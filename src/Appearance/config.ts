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
    {
      name: 'adminBranding',
      type: 'group',
      label: 'Admin branding',
      admin: {
        description:
          'Replace the logo in the admin and on the login screen. Leave empty to use the built-in antidata logo. Use single-colour artwork (SVG or transparent PNG): it is painted in the admin text colour, so it suits light and dark mode automatically (multi-colour artwork becomes a one-colour silhouette).',
      },
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Logo',
          admin: { description: 'Full wordmark, shown on the login screen.' },
        },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          label: 'Icon',
          admin: { description: 'Small mark, shown next to the breadcrumbs.' },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateAppearance],
  },
}
