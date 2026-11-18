import type { CSSProperties, ReactNode } from 'react'

// Chainsaw-themed icon set: chain teeth, guide bars, sprockets, blood drops.
// 24×24, ink strokes in currentColor, so they follow the theme like text does.

export type CsmIconName =
  | 'chat' | 'chapters' | 'settings' | 'profile' | 'chainsaw' | 'heart' | 'sfx'
  | 'book' | 'keyboard' | 'sun' | 'moon' | 'video' | 'mic' | 'send' | 'edit'
  | 'trash' | 'pin' | 'copy' | 'drop' | 'door' | 'logout' | 'plus' | 'key'
  | 'panel' | 'reply' | 'search' | 'close' | 'bell' | 'page'

// sprocket: alternating outer/inner points = saw teeth around a hub
const sprocket = (() => {
  const pts: string[] = []
  const n = 12
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? 9.6 : 7
    const a = (Math.PI * i) / n - Math.PI / 2
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
})()

// a row of chain teeth from x0 to x1 on line y, pointing up (dir -1) or down (dir 1)
const teeth = (x0: number, x1: number, y: number, dir: 1 | -1, step = 2): string => {
  let d = `M${x0} ${y}`
  for (let x = x0; x < x1; x += step) d += ` l${step / 2} ${dir * 1.6} l${step / 2} ${-dir * 1.6}`
  return d
}

const ICONS: Record<CsmIconName, ReactNode> = {
  // speech balloon whose bottom edge is a strip of chain teeth
  chat: <>
    <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7l-2 2-2-2-2 2-2-2-2 2-2-2H7.5L4 19l.6-6H5a2 2 0 0 1-2-2z" />
  </>,
  // stacked manga volumes
  chapters: <>
    <rect x="3" y="4" width="5" height="16" rx="1" />
    <rect x="8" y="4" width="5" height="16" rx="1" />
    <path d="M13.5 5.2l4.3-1.1 3.6 14.8-4.3 1.1z" />
    <path d="M5.5 8v2M10.5 8v2" />
  </>,
  // chain sprocket instead of a gear
  settings: <>
    <polygon points={sprocket} />
    <circle cx="12" cy="12" r="3" />
  </>,
  // devil hunter licence
  profile: <>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <rect x="5" y="8" width="6" height="7" rx="1" />
    <path d="M13.5 9h5M13.5 12h5M13.5 15h3" />
    <path d="M6.5 8l-.7-2M9.5 8l.7-2" />
  </>,
  // the saw itself: engine, handle, guide bar with chain teeth
  chainsaw: <>
    <rect x="2" y="10" width="8" height="7" rx="1.5" />
    <path d="M3.5 10V7.5h5V10" />
    <path d="M10 11h10a2.5 2.5 0 0 1 0 5H10" />
    <path d={teeth(10.5, 20.5, 11, -1)} />
    <circle cx="6" cy="13.5" r="1.2" />
  </>,
  // heart with a saw-cut down the middle
  heart: <>
    <path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 8 2.4C20 15.4 12 20 12 20z" />
    <path d="M12 7.4l-1.4 2.6 2.2 1.6-2 2.2 1.8 1.8-.6 2.4" />
  </>,
  // impact burst for SFX
  sfx: <>
    <path d="M12 2l1.8 5.2 5-2.6-2.2 5.2 5.4 1.2-4.8 3 3.2 4.6-5.4-.8L14 23l-2-5-2 5-1-5.2-5.4.8 3.2-4.6-4.8-3 5.4-1.2L5.2 4.6l5 2.6z" />
    <path d="M12 9.5v4M12 16v.1" />
  </>,
  // open manga
  book: <>
    <path d="M2 5.5c3.2-1.2 6.6-1 10 1.2 3.4-2.2 6.8-2.4 10-1.2v13c-3.2-1.2-6.6-1-10 1.2-3.4-2.2-6.8-2.4-10-1.2z" />
    <path d="M12 6.7v13.2M5 9.5h3.5M5 12.5h3.5M15.5 9.5H19M15.5 12.5H19" />
  </>,
  keyboard: <>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6" />
  </>,
  // sun with saw-tooth corona
  sun: <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
  </>,
  moon: <>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    <path d="M15 5l.6 1.4L17 7l-1.4.6L15 9l-.6-1.4L13 7l1.4-.6z" />
  </>,
  // camera whose top is a strip of teeth
  video: <>
    <rect x="2" y="7" width="13" height="11" rx="2" />
    <path d={teeth(3, 14, 7, -1)} />
    <path d="M15 11l6-3.5v10L15 14" />
  </>,
  mic: <>
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M9 6.5h2M9 9.5h2" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
  </>,
  // guide bar slashing up-right, chain on top, speed lines behind
  send: <>
    <g transform="rotate(-35 12 12)">
      <path d="M5 10h12a2.5 2.5 0 0 1 0 5H5z" />
      <path d={teeth(5.5, 17.5, 10, -1)} />
    </g>
    <path d="M2.5 17.5l3-1.2M3.5 21l3.2-2.6M7 22.5l1.6-2.6" />
  </>,
  edit: <>
    <path d="M15.5 4.5l4 4L9 19l-5 1 1-5z" />
    <path d="M13.5 6.5l4 4" />
  </>,
  // trash can with a toothed lid
  trash: <>
    <path d={teeth(3, 21, 6, -1)} />
    <path d="M5 6l1.2 14a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.5-1.3L19 6" />
    <path d="M10 10v7M14 10v7M9 6V3.5h6V6" />
  </>,
  pin: <>
    <path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z" />
    <path d="M12 14v7" />
  </>,
  copy: <>
    <rect x="8" y="8" width="12" height="12" rx="1.5" />
    <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
  </>,
  // blood drop
  drop: <>
    <path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z" />
    <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
  </>,
  door: <>
    <path d="M5 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M3 21h15" />
    <path d="M12.5 12h.01M16 12h5M19 9.5l2.5 2.5-2.5 2.5" />
  </>,
  logout: <>
    <path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8" />
    <path d="M10 12h11M18 9l3 3-3 3" />
  </>,
  plus: <>
    <path d="M12 4v16M4 12h16" />
  </>,
  // invite code
  key: <>
    <circle cx="7.5" cy="12" r="4" />
    <path d="M11.5 12H21M17 12v3M20 12v2" />
  </>,
  // a manga panel with a torn corner — attach a picture
  panel: <>
    <path d="M4 5h16v11l-4 4H4z" />
    <path d="M16 20v-4h4" />
    <path d="M7 15l3.5-4 2.5 3 1.5-1.5L17 15" />
    <circle cx="9" cy="8.5" r="1.3" />
  </>,
  reply: <>
    <path d="M10 6L4 11.5l6 5.5" />
    <path d="M4.5 11.5H14a6 6 0 0 1 6 6V19" />
  </>,
  // magnifier with saw teeth on the rim
  search: <>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5.5 5.5" />
    <path d="M10.5 3v1.5M3 10.5h1.5M5.2 5.2l1 1" />
  </>,
  close: <>
    <path d="M6 6l12 12M18 6L6 18" />
  </>,
  // a manga page with panels and a dog-ear — save the chapter
  page: <>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M15 3v4h4" />
    <path d="M8.5 9.5h4v4h-4zM14 10.5h2.5M8.5 16h8" />
  </>,
  bell: <>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
    <path d="M10 20.5a2 2 0 0 0 4 0" />
  </>,
}

interface CsmIconProps {
  name: CsmIconName
  size?: number
  strokeWidth?: number
  style?: CSSProperties
  title?: string
}

export default function CsmIcon({ name, size = 20, strokeWidth = 2.1, style, title }: CsmIconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}
      style={{ display: 'inline-block', verticalAlign: '-0.2em', flexShrink: 0, ...style }}
    >
      {title && <title>{title}</title>}
      {ICONS[name]}
    </svg>
  )
}

export const ALL_ICONS = Object.keys(ICONS) as CsmIconName[]
