import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { STICKERS, type Sticker } from '../stickers'

export type StickerDensity = 'off' | 'light' | 'full'

interface StickerBombProps {
  density: StickerDensity
  dark: boolean
  // 'edges' keeps the middle clear (chat), 'everywhere' covers the whole screen (login)
  mode?: 'edges' | 'everywhere'
  // same seed → same layout, so stickers don't jump around on every re-render
  seed?: string
  interactive?: boolean
}

interface Placed {
  sticker: Sticker
  x: number      // % from left
  y: number      // % from top
  size: number   // px
  rotate: number // deg
  delay: number
  z: number
}

// tiny deterministic PRNG (mulberry32) seeded from a string
function rng(seedStr: string) {
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function layout(density: StickerDensity, mode: 'edges' | 'everywhere', seed: string): Placed[] {
  if (density === 'off') return []
  const rand = rng(`${seed}:${density}:${mode}`)
  const pool = [...STICKERS].sort(() => rand() - 0.5)
  const pick = (i: number): Sticker => pool[i % pool.length] as Sticker

  // jittered grid → stickers overlap like a real bombed laptop, but never pile into one spot
  const cols = mode === 'edges' ? 2 : density === 'full' ? 5 : 4
  const rows = density === 'full' ? 5 : 3
  const out: Placed[] = []
  let i = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (density === 'light' && rand() < 0.35) continue
      let x: number
      if (mode === 'edges') {
        // left gutter or right gutter only
        x = c === 0 ? -4 + rand() * 12 : 84 + rand() * 12
      } else {
        x = (c / cols) * 100 + rand() * (100 / cols) - 6
      }
      const y = (r / rows) * 100 + rand() * (100 / rows) - 8
      const sticker = pick(i)
      const base = sticker.kind === 'sfx' ? 90 : sticker.kind === 'card' ? (sticker.ratio === 'auto' ? 120 : 92) : 140
      out.push({
        sticker, x, y,
        size: base * (0.75 + rand() * 0.6),
        rotate: -28 + rand() * 56,
        delay: 0.05 * i,
        z: Math.floor(rand() * 10),
      })
      i++
    }
  }
  return out
}

// white die-cut edge that hugs the alpha channel of the PNG, plus a soft drop shadow
const DIE_CUT =
  'drop-shadow(2.5px 0 0 #fff) drop-shadow(-2.5px 0 0 #fff) drop-shadow(0 2.5px 0 #fff) ' +
  'drop-shadow(0 -2.5px 0 #fff) drop-shadow(3px 5px 4px rgba(0,0,0,0.35))'

function StickerBody({ sticker, size }: { sticker: Sticker; size: number }) {
  if (sticker.kind === 'cut') {
    return (
      <img
        src={sticker.src} alt="" draggable={false} loading="lazy"
        style={{ width: size, height: size, objectFit: 'contain', filter: DIE_CUT, display: 'block' }}
      />
    )
  }
  if (sticker.kind === 'card') {
    return (
      <div style={{
        position: 'relative', width: size, padding: 5, background: '#fff', borderRadius: 12,
        boxShadow: '3px 5px 8px rgba(0,0,0,0.35)',
      }}>
        {/* tape strip */}
        <div style={{
          position: 'absolute', top: -9, left: '50%', width: size * 0.45, height: 16,
          transform: 'translateX(-50%) rotate(-4deg)',
          background: 'rgba(255, 236, 190, 0.75)', borderRadius: 2,
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        }} />
        <img
          src={sticker.src} alt="" draggable={false}
          style={{ width: '100%', aspectRatio: sticker.ratio ?? '4 / 5', objectFit: 'cover', borderRadius: 8, display: 'block' }}
        />
      </div>
    )
  }
  return (
    <div style={{
      fontFamily: 'BlambotClassic, sans-serif',
      fontSize: size * 0.32, lineHeight: 1, whiteSpace: 'nowrap',
      color: sticker.color, letterSpacing: '1px',
      padding: '8px 12px', background: '#fff', borderRadius: 999,
      WebkitTextStroke: sticker.color === '#111' ? '0' : '1px #111',
      boxShadow: '3px 5px 8px rgba(0,0,0,0.3)',
    }}>
      {sticker.text}
    </div>
  )
}

export default function StickerBomb({
  density, dark, mode = 'everywhere', seed = 'chainsaw', interactive = false,
}: StickerBombProps) {
  const placed = useMemo(() => layout(density, mode, seed), [density, mode, seed])
  if (!placed.length) return null

  const opacity = mode === 'edges' ? (density === 'full' ? 0.85 : 0.6) : 0.95
  const layer: CSSProperties = {
    position: 'absolute', inset: 0, overflow: 'hidden',
    pointerEvents: interactive ? 'auto' : 'none',
    zIndex: 0,
  }

  return (
    <div style={layer} aria-hidden>
      {placed.map((p, i) => (
        <motion.div
          key={`${seed}-${i}`}
          // "slap" onto the surface: drops in a bit bigger and over-rotated, then settles
          initial={{ opacity: 0, scale: 1.35, rotate: p.rotate + 18 }}
          animate={{ opacity, scale: 1, rotate: p.rotate }}
          transition={{ type: 'spring', stiffness: 380, damping: 18, delay: p.delay }}
          whileHover={interactive ? { scale: 1.1, rotate: p.rotate - 6, zIndex: 20 } : undefined}
          whileTap={interactive ? { scale: 0.95 } : undefined}
          style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, zIndex: p.z,
            filter: dark ? 'brightness(0.88)' : undefined,
            cursor: interactive ? 'grab' : undefined,
          }}
        >
          <StickerBody sticker={p.sticker} size={p.size} />
        </motion.div>
      ))}
    </div>
  )
}
