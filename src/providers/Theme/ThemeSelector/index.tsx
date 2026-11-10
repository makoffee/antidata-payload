'use client'

import { Moon, Sun } from 'lucide-react'
import React from 'react'

import { useTheme } from '..'

// Sun / moon switch for the header. Which icon shows is keyed off the page's own theme on
// <html> (not the header's local data-theme over dark heroes), so it renders the same on
// the server and needs no client-only state.
export const ThemeToggle: React.FC = () => {
  const { setTheme } = useTheme()

  const toggle = () => {
    const current = document.documentElement.getAttribute('data-theme')
    setTheme(current === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      aria-label="Switch between light and dark mode"
      className="relative flex size-5 items-center justify-center text-primary"
      onClick={toggle}
      type="button"
    >
      <Sun className="absolute w-5 transition-[rotate,scale] duration-300 [html[data-theme=dark]_&]:-rotate-90 [html[data-theme=dark]_&]:scale-0" />
      <Moon className="absolute w-5 rotate-90 scale-0 transition-[rotate,scale] duration-300 [html[data-theme=dark]_&]:rotate-0 [html[data-theme=dark]_&]:scale-100" />
    </button>
  )
}
