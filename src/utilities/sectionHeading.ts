// Section intros: a lighter, large h2 under the page's single bold hero h1. Subtext uses
// the shadcn/ui "lead" style.
export const sectionHeadingClass =
  'scroll-m-20 text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight'
export const sectionTextClass = 'mt-4 text-xl text-muted-foreground'

// Same styles for intros written in rich text (an h2 followed by a paragraph)
export const sectionRichTextClass = [
  'prose-h2:mb-0 prose-h2:mt-0 prose-h2:scroll-m-20 prose-h2:text-3xl md:prose-h2:text-4xl lg:prose-h2:text-5xl',
  'prose-h2:font-medium prose-h2:tracking-tight',
  'prose-p:mt-4 prose-p:text-xl prose-p:text-muted-foreground',
].join(' ')
