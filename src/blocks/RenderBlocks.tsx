import React, { Fragment } from 'react'

import { Reveal } from '@/components/Reveal'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ProjectsBlockComponent } from '@/blocks/ProjectsBlock/Component'
import { LogoWallBlock } from '@/blocks/LogoWall/Component'
import { CardGridBlock } from '@/blocks/CardGrid/Component'

// These blocks animate their own heading and cards on scroll
const selfRevealing = new Set(['archive', 'cardGrid', 'cta', 'logoWall'])

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  projectsBlock: ProjectsBlockComponent,
  logoWall: LogoWallBlock,
  cardGrid: CardGridBlock,
}

// Anchor for #hash links: the editor's "Block name" in the admin, slugified
// (e.g. "Case Studies" -> #case-studies). Falls back to the block's id.
const anchorFor = (block: Page['layout'][0]) =>
  block.blockName
    ?.toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `block-${block.id}`

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div
                  // The form sits right under the page heading; the hero's own bottom margin is the gap
                  className={
                    blockType === 'formBlock' ? 'mt-0 mb-16 scroll-mt-8' : 'my-16 scroll-mt-8'
                  }
                  id={anchorFor(block)}
                  key={index}
                >
                  {selfRevealing.has(blockType) ? (
                    // @ts-expect-error there may be some mismatch between the expected types here
                    <Block {...block} disableInnerContainer />
                  ) : (
                    <Reveal>
                      {/* @ts-expect-error there may be some mismatch between the expected types here */}
                      <Block {...block} disableInnerContainer />
                    </Reveal>
                  )}
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
