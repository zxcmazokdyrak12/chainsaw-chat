// manga balloon parts drawn in SVG, shared by message bubbles

// little tail glued under an oval / rounded balloon, on the speaker's side
export function BalloonTail({ own }: { own: boolean }) {
  return (
    <svg
      viewBox="0 0 34 30" aria-hidden
      style={{
        position: 'absolute', bottom: '-19px', width: '34px', height: '30px',
        overflow: 'visible', zIndex: 2, pointerEvents: 'none',
        ...(own ? { right: '18%', transform: 'scaleX(-1)' } : { left: '18%' }),
      }}
    >
      <path d="M3 0 L31 0 L5 28 Z" fill="var(--paper)" />
      <path d="M28 7 L5 28 L10 8" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const SHOUT_POINTS = '20,40 60,48 70,8 110,36 150,4 175,34 215,6 235,36 285,12 290,44 345,30 330,62 372,76 332,90 352,124 300,108 288,144 245,114 215,146 185,112 140,140 120,108 70,132 72,100 18,110 46,78 4,62 44,56'

// CAPS = a jagged shout balloon stretched behind the text
export function ShoutBalloon() {
  return (
    <svg viewBox="0 0 380 150" preserveAspectRatio="none" aria-hidden
      style={{ position: 'absolute', inset: '-10px -16px', width: 'calc(100% + 32px)', height: 'calc(100% + 20px)', overflow: 'visible', pointerEvents: 'none' }}>
      <polygon
        fill="var(--paper)" stroke="var(--ink)" strokeWidth="3.5" strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        points={SHOUT_POINTS}
      />
    </svg>
  )
}
