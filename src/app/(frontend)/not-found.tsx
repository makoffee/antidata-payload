import Link from 'next/link'
import React from 'react'

import { NotFoundArt } from '@/components/NotFoundArt'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container py-28">
      <h1 className="sr-only">404: page not found</h1>
      <NotFoundArt />
      <Button asChild className="font-mono" variant="default">
        <Link href="/">&lt; Back to the Future</Link>
      </Button>
    </div>
  )
}
