import Link from 'next/link'
import React from 'react'

import { Reveal } from '@/components/Reveal'

import type { ProjectCardData } from '@/components/ProjectCard'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

// Tall "story" cards: square artwork fading into a blurred, colour-matched text area.
// Below lg the row scrolls sideways with snap points (bleeding to the screen edge);
// from lg up it becomes a 4-column grid.
export const ProjectStories: React.FC<{
  className?: string
  projects: (ProjectCardData & { id: number | string })[]
}> = ({ className, projects }) => {
  if (!projects.length) {
    return <p className="text-muted-foreground">No projects published yet.</p>
  }

  return (
    <ul
      className={cn(
        'flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain',
        '-mx-4 px-4 scroll-px-4 md:-mx-8 md:px-8 md:scroll-px-8',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        'lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0',
        className,
      )}
    >
      {projects.map((project, index) => (
        <li
          className="w-[78%] shrink-0 snap-start sm:w-[45%] md:w-[38%] lg:w-auto"
          key={project.id}
        >
          <Reveal delay={(index % 4) * 0.06}>
            <ProjectStoryCard priority={index < 2} project={project} />
          </Reveal>
        </li>
      ))}
    </ul>
  )
}

const ProjectStoryCard: React.FC<{ project: ProjectCardData; priority?: boolean }> = ({
  project,
  priority,
}) => {
  const { slug, title, summary, coverImage, storyImage, client, year } = project
  const meta = [client, year].filter(Boolean).join(' · ')
  const story = storyImage && typeof storyImage === 'object' ? storyImage : null
  const cover = coverImage && typeof coverImage === 'object' ? coverImage : null
  const cardSize = '(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 25vw'
  const zoom = 'transition-transform duration-700 ease-out group-hover:scale-105'

  return (
    <Link
      className="group relative isolate block aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2"
      href={`/portfolio/${slug}`}
    >
      {story ? (
        // A purpose-made tall image fills the whole card
        <Media
          fill
          imgClassName={cn('object-cover', zoom)}
          priority={priority}
          resource={story}
          size={cardSize}
        />
      ) : (
        cover && (
          <>
            {/* "App of the Day" style: a heavily blurred copy colours the card… */}
            <div aria-hidden className="absolute inset-0 -z-10 scale-150 blur-3xl saturate-150">
              <Media fill imgClassName="object-cover" resource={cover} size="160px" />
            </div>
            {/* …and the artwork sits in a square safe zone that dissolves into it */}
            <div className="absolute inset-x-0 top-0 aspect-square overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
              <Media
                fill
                imgClassName={cn('object-cover', zoom)}
                priority={priority}
                resource={cover}
                size={cardSize}
              />
            </div>
          </>
        )
      )}
      {/* Keeps the text readable on any colour */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="text-xl font-medium leading-tight">{title}</h3>
        {meta && <p className="mt-1 text-sm text-white/70">{meta}</p>}
        {summary && (
          <p className="mt-3 text-sm leading-relaxed text-white/85 line-clamp-2">{summary}</p>
        )}
      </div>
    </Link>
  )
}
