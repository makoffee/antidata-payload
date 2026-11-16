import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    // Single-user site: hide Users from the sidebar. Edit your own name and avatar at /admin/account.
    // (Routes stay enabled, so /admin/collections/users still works if a second user is ever needed.)
    group: false,
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      // Profile picture: shown as the admin avatar (top right)
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Profile picture. Shown as your avatar in the admin.' },
    },
  ],
  timestamps: true,
}
