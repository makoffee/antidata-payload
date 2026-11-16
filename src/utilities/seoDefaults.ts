import { SITE_NAME, TITLE_SUFFIX } from './site'

// Defaults for a post's search title and description. They follow the post until you type
// your own value in the SEO tab (see the beforeChange hook on Posts).

export const defaultSeoTitle = (title?: string | null): string =>
  title ? `${title} | ${TITLE_SUFFIX}` : SITE_NAME

type LexicalNode = { children?: LexicalNode[]; text?: string; type?: string }

const nodeText = (node?: LexicalNode): string =>
  node?.text ?? (node?.children ?? []).map(nodeText).join(' ')

// First readable text from the rich-text body, cut at a word boundary to fit a search snippet
export const defaultSeoDescription = (content?: unknown, max = 155): string => {
  const root = (content as { root?: LexicalNode } | null | undefined)?.root
  const paragraphs = (root?.children ?? [])
    .filter((n) => n.type === 'paragraph')
    .map((n) => nodeText(n).replace(/\s+/g, ' ').trim())
    // skip hashtag-only and link-only lines
    .filter((t) => t && !/^(#\S+\s*)+$/.test(t) && !/^https?:\/\/\S+$/.test(t))

  const text = paragraphs.join(' ')
  if (text.length <= max) return text

  const cut = text.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).trimEnd()}…`
}

// --- Rules per collection --------------------------------------------------------------------

// Plain text of the first rich-text node matching `test` (used to read a page's hero)
type HeroNode = { type?: string; tag?: string; text?: string; children?: HeroNode[] }
const textOf = (n: HeroNode): string => n.text ?? (n.children || []).map(textOf).join('')
const findText = (root: HeroNode | undefined, test: (n: HeroNode) => boolean): string => {
  const hit = root?.children?.find(test)
  return hit ? textOf(hit).trim() : ''
}
const heroParts = (doc: any) => {
  const root = (doc?.hero?.richText as { root?: HeroNode } | null | undefined)?.root
  return {
    heading: findText(root, (n) => n.type === 'heading' && n.tag === 'h1'),
    subline: findText(root, (n) => n.type === 'paragraph'),
    keywords: (doc?.hero?.keywords || []) as string[],
  }
}

export type SeoCollection = 'pages' | 'posts' | 'projects'

// Pages: the hero heading (or the title); posts and projects: the title
export const seoTitleFor = (collection: SeoCollection, doc: any): string => {
  if (collection === 'pages') {
    const { heading } = heroParts(doc)
    return defaultSeoTitle(heading || doc?.title)
  }
  return defaultSeoTitle(doc?.title)
}

// Pages: hero subline plus keywords; posts: start of the body; projects: the summary
export const seoDescriptionFor = (collection: SeoCollection, doc: any): string => {
  if (collection === 'pages') {
    const { subline, keywords } = heroParts(doc)
    return [subline, keywords.join(', ')].filter(Boolean).join(' ')
  }
  if (collection === 'posts') return defaultSeoDescription(doc?.content)
  return doc?.summary || ''
}

// beforeChange hook: a SEO field that is empty, or still equal to the last auto value, follows
// the document; a value you typed yourself is left alone.
export const autoFillSeo =
  (collection: SeoCollection) =>
  ({ data, originalDoc }: { data: any; originalDoc?: any }) => {
    const merged = { ...(originalDoc ?? {}), ...data }
    const meta = { ...(data.meta ?? {}) }

    if (!meta.title || meta.title === seoTitleFor(collection, originalDoc)) {
      meta.title = seoTitleFor(collection, merged)
    }
    if (!meta.description || meta.description === seoDescriptionFor(collection, originalDoc)) {
      meta.description = seoDescriptionFor(collection, merged)
    }

    return { ...data, meta }
  }
