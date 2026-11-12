import React from 'react'

import type { Project } from '@/payload-types'

import { Media } from '@/components/Media'
import { ScrollToLink } from '@/components/ScrollToLink'

export const ProjectHero: React.FC<{
  project: Project
  /** The page has an interactive Experience preview: "Live" links down to it instead of off-site */
  hasDemo?: boolean
}> = ({ project, hasDemo = false }) => {
  const { title, summary, coverImage, client, year, services, projectUrl } = project

  const details = [
    { label: 'Client', value: client },
    { label: 'Year', value: year },
    { label: 'Services', value: services?.length ? services.join(', ') : null },
  ].filter((detail) => detail.value)

  return (
    <header>
      <div className="container">
        <h1 className="max-w-[20ch] text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight">
          {title}
        </h1>
        {summary && <p className="mt-6 max-w-[48rem] text-xl text-muted-foreground">{summary}</p>}

        {(details.length > 0 || projectUrl || hasDemo) && (
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-6 md:grid-cols-4">
            {details.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1">{value}</dd>
              </div>
            ))}
            {hasDemo ? (
              <div>
                <dt className="text-sm text-muted-foreground">Live</dt>
                <dd className="mt-1">
                  <ScrollToLink
                    className="group inline-flex items-center gap-1 underline underline-offset-4 hover:no-underline"
                    targetId="experience"
                  >
                    Live demo
                    <span
                      aria-hidden
                      className="inline-block transition-transform duration-300 ease-out group-hover:translate-y-0.5 motion-reduce:transition-none"
                    >
                      ↓
                    </span>
                  </ScrollToLink>
                </dd>
              </div>
            ) : (
              projectUrl && (
                <div>
                  <dt className="text-sm text-muted-foreground">Live</dt>
                  <dd className="mt-1">
                    <a
                      className="underline underline-offset-4 hover:no-underline"
                      href={projectUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Visit site ↗
                    </a>
                  </dd>
                </div>
              )
            )}
          </dl>
        )}
      </div>

      {coverImage && typeof coverImage === 'object' && (
        <div className="container mt-12">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
            <Media fill priority imgClassName="object-cover" resource={coverImage} size="100vw" />
          </div>
        </div>
      )}
    </header>
  )
}
