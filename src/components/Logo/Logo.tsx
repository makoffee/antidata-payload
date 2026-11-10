import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
}

// Inline so the mark takes the surrounding text colour (currentColor): black in the light
// theme, white in the dark theme and over dark heroes, with no second file to swap in.
const mark = (
  <>
    <polygon points="461.3 324.9 301.4 47.9 249.7 47.8 383.8 280.1 238.7 280.1 212.8 324.9 461.3 324.9" />
    <polygon points="106.8 384.6 426.7 384.6 452.6 339.9 184.4 339.9 255.4 216.9 229.6 172 132.7 339.9 106.8 384.6" />
    <polygon points="229.7 47.8 69.8 324.8 95.6 369.7 229.7 137.4 302.3 262.9 354 262.9 229.7 47.8" />
  </>
)

export const Logo = ({ className }: Props) => (
  <svg
    aria-label="antidata"
    className={clsx('h-9 w-auto', className)}
    fill="currentColor"
    role="img"
    viewBox="50 30 1550 380"
    xmlns="http://www.w3.org/2000/svg"
  >
    {mark}
    <path d="M998,137.9h-143.1v129.9l-136.4-142.6v196.5l-87.8-195.5-92.5,198.7h30.4l20.8-45.4h80l19.6,45.4h57.7v-130.9l136.4,142.3v-171.8h43.4v160.4h28.2v-160.4h43.3v160.4h28.2v-187h-28.2ZM601.3,253l29.1-63.6,27.7,63.6h-56.8Z" />
    <path d="M1162,162c-9.5-8.7-20.1-14.9-31.8-18.5-10.9-3.7-25.8-5.6-44.6-5.6h-39.2v187h38.8c19,0,33.6-1.7,44-5.2,11.1-3.5,21.6-9.6,31.7-18.5,20.1-17.8,30.2-41,30.2-69.8s-9.6-51.8-28.9-69.4ZM1141.7,280.9c-6.8,6.1-14.4,10.6-22.8,13.4-8.4,2.7-18.9,4-31.6,4h-12.7v-133.9h12.7c24.1,0,42.3,5.7,54.6,17.1,13.7,12.8,20.6,29.4,20.6,49.9s-6.9,36.9-20.8,49.5Z" />
    <path d="M1171,324.9h30.4l20.8-45.4h80l19.6,45.4h30.9l-89.2-198.7-92.5,198.7ZM1234,253l29.1-63.6,27.7,63.6h-56.8Z" />
    <polygon points="1435.4 137.9 1321.3 137.9 1321.3 164.4 1364.3 164.4 1364.3 324.9 1392.5 324.9 1392.5 164.4 1435.4 164.4 1435.4 137.9" />
    <path d="M1496.7,126.2l-92.5,198.7h30.4l20.8-45.4h80l19.6,45.4h30.9l-89.2-198.7ZM1467.1,253l29.1-63.6,27.7,63.6h-56.8Z" />
  </svg>
)

// The mark on its own, for the footer
export const LogoIcon = ({ className }: Props) => (
  <svg
    aria-label="antidata"
    className={clsx('size-10', className)}
    fill="currentColor"
    role="img"
    viewBox="50 30 420 365"
    xmlns="http://www.w3.org/2000/svg"
  >
    {mark}
  </svg>
)
