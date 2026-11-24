import React from 'react'

// 5 x 5 dot-grid "wave" loader, after the one at https://dot-matrix-animations.vercel.app/
// (a 2.4s ease-in-out pulse; each column starts 480ms after the one to its left, each row 48ms
// later than the one above). Draws in currentColor, so it follows the text color around it.
const CELLS = [0, 1, 2, 3, 4]
const POSITION = (index: number): number => 6 + index * 11

export const DotMatrixWave: React.FC<{ className?: string }> = ({ className }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 56 56">
    <style>{`
      .dot-wave-lit { opacity: 0; fill: currentColor; animation: dot-wave 2400ms cubic-bezier(0.65, 0, 0.35, 1) infinite both; }
      @keyframes dot-wave { 0% { opacity: 0.05 } 20% { opacity: 1 } 55% { opacity: 0.18 } 100% { opacity: 0.05 } }
      @media (prefers-reduced-motion: reduce) { .dot-wave-lit { animation: none; opacity: 0.45; } }
    `}</style>
    {CELLS.map((row) =>
      CELLS.map((col) => (
        <React.Fragment key={`${row}-${col}`}>
          <circle
            cx={POSITION(col)}
            cy={POSITION(row)}
            fill="currentColor"
            opacity={0.12}
            r={2.4}
          />
          <circle
            className="dot-wave-lit"
            cx={POSITION(col)}
            cy={POSITION(row)}
            r={3.1}
            style={{ animationDelay: `${row * 48 + col * 480}ms` }}
          />
        </React.Fragment>
      )),
    )}
  </svg>
)
