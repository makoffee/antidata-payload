import React from 'react'

// A sword run through the ANTIDATA wordmark (in one side, out the other) with "404" centred
// above it, above a root shell where the shrug fails to run. Lines are separate strings
// because the art contains a backtick
const art = [
  '                                     404',
  '',
  '            /\\      ___   _  _______________  ___ _________',
  '/vvvvvvvvvvvv \\----/ _ | / |/ /_  __/  _/ _ \\/ _ /_  __/ _ |-----------,',
  '`^^^^^^^^^^^^ /===/ __ |/    / / / _/ // // / __ |/ / / __ |============"',
  '            \\/   /_/ |_/_/|_/ /_/ /___/____/_/ |_/_/ /_/ |_|',
].join('\n')

const accent = 'text-foreground dark:text-[#ccff00]'

const Prompt = () => <span className={accent}>root@antidata:~# </span>

export const NotFoundArt: React.FC = () => (
  <div className="mb-12 font-mono text-sm text-muted-foreground md:text-base">
    {/* Shrinks on narrow phones so the art never scrolls */}
    <pre
      aria-hidden
      className={`mb-16 text-[2.1vw] leading-snug select-none md:text-sm lg:text-base ${accent}`}
    >
      {art}
    </pre>
    <pre className="leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap">
      <Prompt />
      <span className="text-foreground">{String.raw`¯\_(ツ)_/¯`}</span>
      {'\n'}Oops: well, this is embarrassing.{'\n'}
      <Prompt />
      <span aria-hidden className={`motion-safe:animate-blink ${accent}`}>
        █
      </span>
    </pre>
  </div>
)
