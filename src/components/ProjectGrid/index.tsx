import React from 'react'

import { Reveal } from '@/components/Reveal'

import { ProjectCard, type ProjectCardData } from '@/components/ProjectCard'
import { cn } from '@/utilities/ui'

export const ProjectGrid: React.FC<{
  className?: string
  projects: (ProjectCardData & { id: number | string })[]
}> = ({ className, projects }) => {
  if (!projects.length) {
    return <p className="text-muted-foreground">No projects published yet.</p>
  }

  return (
    <div className={cn('grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3', className)}>
      {projects.map((project, index) => (
        <Reveal delay={(index % 3) * 0.06} key={project.id}>
          <ProjectCard priority={index < 3} project={project} />
        </Reveal>
      ))}
    </div>
  )
}
