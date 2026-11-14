// Section intros: a lighter, large h2 (fluid 26px → 42px, golden scale) under the page's single bold hero h1. Subtext uses
// the shadcn/ui "lead" style.
export const sectionHeadingClass =
  'scroll-m-20 text-[length:clamp(var(--text-phi-2),1.1rem+2vw,var(--text-phi-4))] font-medium tracking-tight'
export const sectionTextClass = 'mt-4 text-phi-1 text-foreground/85'

// Same styles for intros written in rich text (an h2 followed by a paragraph)
export const sectionRichTextClass = [
  'prose-h2:mb-0 prose-h2:mt-0 prose-h2:scroll-m-20 prose-h2:text-[length:clamp(var(--text-phi-2),1.1rem+2vw,var(--text-phi-4))]',
  'prose-h2:font-medium prose-h2:tracking-tight',
  'prose-p:mt-4 prose-p:text-phi-1 prose-p:text-foreground/85',
].join(' ')
