import React from 'react'

// 5 x 5 dot-grid "loading" spinner, after the one at https://dot-matrix-animations.vercel.app/
// A bright dot with a fading trail sweeps clockwise around the outer ring (2s, linear; each ring
// dot starts 125ms after the one before it). Draws in currentColor, so it follows the text color.
const CELLS = [0, 1, 2, 3, 4]
const POSITION = (index: number): number => 6 + index * 11

// The 16 outer cells, clockwise from the top-left corner: [row, column]
const RING: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 4], [2, 4], [3, 4],
  [4, 4], [4, 3], [4, 2], [4, 1], [4, 0],
  [3, 0], [2, 0], [1, 0],
]

export const DotMatrixSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 56 56">
    <style>{`
      .dot-spinner-lit { opacity: 0; fill: currentColor; animation: dot-spinner 2000ms linear infinite both; }
      @keyframes dot-spinner { 0% { opacity: 0 } 4% { opacity: 1 } 26% { opacity: 0.08 } 100% { opacity: 0 } }
      @media (prefers-reduced-motion: reduce) { .dot-spinner-lit { animation: none; opacity: 0.45; } }
    `}</style>
    {CELLS.map((row) =>
      CELLS.map((col) => (
        <circle
          cx={POSITION(col)}
          cy={POSITION(row)}
          fill="currentColor"
          key={`${row}-${col}`}
          opacity={0.12}
          r={2.4}
        />
      )),
    )}
    {RING.map(([row, col], index) => (
      <circle
        className="dot-spinner-lit"
        cx={POSITION(col)}
        cy={POSITION(row)}
        key={`${row}-${col}`}
        r={3.1}
        style={{ animationDelay: `${index * 125}ms` }}
      />
    ))}
  </svg>
)
