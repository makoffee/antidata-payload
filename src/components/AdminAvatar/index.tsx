'use client'
import { useAuth } from '@payloadcms/ui'
import { User as UserIcon } from 'lucide-react'
import React from 'react'

// Round avatar in the admin's top-right corner: the user's profile image, or the default user icon
export const AdminAvatar: React.FC = () => {
  const { user } = useAuth<{ avatar?: unknown; email?: string; name?: string }>()
  const avatar = user?.avatar as
    | { alt?: string; sizes?: { thumbnail?: { url?: string } }; url?: string }
    | number
    | string
    | null
    | undefined

  const src = avatar && typeof avatar === 'object' ? avatar.sizes?.thumbnail?.url || avatar.url : null

  const style: React.CSSProperties = {
    alignItems: 'center',
    background: 'var(--theme-elevation-150)',
    borderRadius: '50%',
    color: 'var(--theme-text)',
    display: 'flex',
    height: 25,
    justifyContent: 'center',
    objectFit: 'cover',
    width: 25,
  }

  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" height={25} src={src} style={style} width={25} />
  ) : (
    <div style={style}>
      <UserIcon aria-hidden size={15} />
    </div>
  )
}
