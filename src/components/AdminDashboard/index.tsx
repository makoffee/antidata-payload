import type { ServerProps } from 'payload'

import React from 'react'

import { getClientSideURL } from '@/utilities/getURL'

import './index.scss'

// Shown at the top of the admin dashboard: shortcuts for everyday editing plus
// a list of unpublished drafts so nothing gets forgotten.
const AdminDashboard: React.FC<ServerProps> = async ({ payload, user }) => {
  const adminRoute = payload.config.routes.admin
  const siteURL = getClientSideURL()

  const [projectDrafts, pageDrafts, homePage] = await Promise.all([
    payload.find({
      collection: 'projects',
      depth: 0,
      limit: 10,
      select: { title: true },
      where: { _status: { equals: 'draft' } },
    }),
    payload.find({
      collection: 'pages',
      depth: 0,
      limit: 10,
      select: { title: true },
      where: { _status: { equals: 'draft' } },
    }),
    payload.find({
      collection: 'pages',
      depth: 0,
      limit: 1,
      select: { slug: true },
      where: { slug: { equals: 'home' } },
    }),
  ])

  const homeId = homePage.docs[0]?.id

  const actions = [
    { label: '+ New project', href: `${adminRoute}/collections/projects/create` },
    { label: 'Reorder projects', href: `${adminRoute}/collections/projects` },
    homeId
      ? { label: 'Edit homepage', href: `${adminRoute}/collections/pages/${homeId}` }
      : { label: 'Pages', href: `${adminRoute}/collections/pages` },
    { label: 'Media library', href: `${adminRoute}/collections/media` },
    { label: 'Navigation', href: `${adminRoute}/globals/header` },
  ]

  const drafts = [
    ...projectDrafts.docs.map((doc) => ({
      title: doc.title,
      type: 'Project',
      href: `${adminRoute}/collections/projects/${doc.id}`,
    })),
    ...pageDrafts.docs.map((doc) => ({
      title: doc.title,
      type: 'Page',
      href: `${adminRoute}/collections/pages/${doc.id}`,
    })),
  ]

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h2>Hi{user && 'name' in user && user.name ? ` ${user.name}` : ''} 👋</h2>
        <a href={siteURL} rel="noopener noreferrer" target="_blank">
          View site ↗
        </a>
      </div>

      <div className="admin-dashboard__actions">
        {actions.map((action) => (
          <a className="admin-dashboard__action" href={action.href} key={action.label}>
            {action.label}
          </a>
        ))}
      </div>

      {drafts.length > 0 && (
        <div className="admin-dashboard__drafts">
          <h4>Unpublished drafts</h4>
          <ul>
            {drafts.map((draft) => (
              <li key={draft.href}>
                <a href={draft.href}>{draft.title || 'Untitled'}</a>
                <span>{draft.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="admin-dashboard__note">
        Local and live share the same content, so edits here are real. Changes appear on the live
        site within a minute.
      </p>
    </div>
  )
}

export default AdminDashboard
