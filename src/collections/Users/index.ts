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
  // Login hardening (these match or tighten Payload's defaults, so no schema change)
  auth: {
    // Five wrong passwords lock the account for 15 minutes, which makes guessing impractical
    lockTime: 15 * 60 * 1000,
    maxLoginAttempts: 5,
    // A session lasts 8 hours (seconds), not the default 2: a stolen cookie goes stale sooner,
    // and a normal working day needs only one login
    tokenExpiration: 8 * 60 * 60,
    cookies: {
      // Production is always HTTPS; plain http://localhost still works for local dev
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
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
      admin: { description: 'Profile picture.' },
    },
  ],
  timestamps: true,
}
