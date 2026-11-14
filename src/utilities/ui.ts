/**
 * Utility functions for UI components automatically added by ShadCN and used in a few of our frontend components and blocks.
 *
 * Other functions may be exported from here in the future or by installing other shadcn components.
 */

import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach the class merger that text-phi-0..6 (the golden type scale) are font sizes, not colours,
// so cn('text-phi-1', 'text-muted-foreground') keeps both.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['phi-0', 'phi-1', 'phi-2', 'phi-3', 'phi-4', 'phi-5', 'phi-6'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
