import { motion, AnimatePresence } from 'framer-motion'

// Manga sound effects that pop over the feed for a moment:
// a CAPS message slams a big DOOOM, your own send gets a small DON, someone joining — ZAP!

export interface SfxBurst {
  id: number
  text: string
  x: number      // % from left of the feed panel
  y: number      // % from top
  size: number   // px
  rotate: number // deg
}

const SHOUT_WORDS = ['DOOOM', 'ZUDOM', 'GOGOGO', 'DOKAN!', 'BAKOOM']
const SEND_WORDS  = ['DON', 'TAP', 'SHUP']
const JOIN_WORDS  = ['ZAP!', 'BAM!', 'KA-CHAK']

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)] as T

let nextId = 1

export function makeBurst(kind: 'shout' | 'send' | 'join', own: boolean): SfxBurst {
  const id = nextId++
  if (kind === 'shout') {
    return {
      id, text: pick(SHOUT_WORDS),
      x: own ? 48 + Math.random() * 18 : 22 + Math.random() * 18,
      y: 55 + Math.random() * 20,
      size: 54 + Math.random() * 18,
      rotate: -14 + Math.random() * 28,
    }
  }
  if (kind === 'join') {
    return { id, text: pick(JOIN_WORDS), x: 38 + Math.random() * 18, y: 60 + Math.random() * 12, size: 30, rotate: -8 + Math.random() * 16 }
  }
  return { id, text: pick(SEND_WORDS), x: 70 + Math.random() * 14, y: 72 + Math.random() * 10, size: 26, rotate: -10 + Math.random() * 20 }
}

export default function SfxLayer({ bursts }: { bursts: SfxBurst[] }) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, overflow: 'hidden' }}>
      <AnimatePresence>
        {bursts.map(b => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.4, rotate: b.rotate - 12 }}
            animate={{ opacity: 1, scale: [0.4, 1.18, 1], rotate: b.rotate }}
            exit={{ opacity: 0, scale: 1.25, transition: { duration: 0.25 } }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{
              position: 'absolute', left: `${b.x}%`, top: `${b.y}%`,
              x: '-50%', y: '-50%',
              fontFamily: "'DeathRattle', 'BlambotClassic', sans-serif",
              fontSize: `${b.size}px`, lineHeight: 1, letterSpacing: '2px',
              whiteSpace: 'nowrap',
              // hollow letters with an ink outline and a hard ink drop — classic manga SFX
              color: 'var(--paper)',
              WebkitTextStroke: `${b.size > 40 ? 3 : 2}px var(--ink)`,
              textShadow: `${b.size > 40 ? 4 : 2}px ${b.size > 40 ? 4 : 2}px 0 var(--ink)`,
            }}
          >
            {b.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
