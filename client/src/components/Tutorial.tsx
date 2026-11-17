import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Onboarding tour: dims the screen, cuts a spotlight around the element to tap,
// and a character sticker explains it in a manga speech card.
// Targets are found by data-tour="..." attributes; a step whose target isn't on screen is skipped.

export interface TourStep {
  target?: string        // data-tour value(s), comma separated = first visible wins; none → centered card
  title: string
  text: string
  sticker: string        // transparent PNG/WebP cut-out
  pick?: 'first' | 'last' // when several elements match (e.g. message bubbles)
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'WOOF! WELCOME',
    text: "This is Chainsaw Chat. Let me show you around — it takes 30 seconds, promise.",
    sticker: '/stickers/reze_flowers.webp',
  },
  {
    target: 'rooms,tab-rooms',
    title: 'ROOMS',
    text: 'Every chat lives in a room. Make your own or join a friend\'s with an invite code from the ROOMS tab.',
    sticker: '/stickers/aki_smoke.webp',
  },
  {
    target: 'input',
    title: 'TALK',
    text: 'Type here and hit Enter to send. Turn on CAPS LOCK if you want the chainsaw to roar.',
    sticker: '/stickers/power_salute.webp',
  },
  {
    target: 'mic',
    title: 'VOICE MESSAGES',
    text: 'Hold this button to record. Let go and it sends.',
    sticker: '/stickers/crop_makima_eyes.jpg',
  },
  {
    target: 'bubble,messages',
    pick: 'last',
    title: 'REACT & MORE',
    text: 'Right-click a message (long-press on phone) to react, edit, pin or delete. Double-click drops a 🔥.',
    sticker: '/stickers/makima_sit.webp',
  },
  {
    target: 'call',
    title: 'VIDEO CALLS',
    text: 'Start a call for everyone in this room. Up to 4 devil hunters at once.',
    sticker: '/stickers/kishibe_quanxi.webp',
  },
  {
    target: 'tab-settings',
    title: 'SETTINGS',
    text: 'Theme, sounds and how many stickers get slapped on the walls. You can replay this tour from there too.',
    sticker: '/stickers/kobeni_peace.webp',
  },
  {
    title: "YOU'RE READY",
    text: 'That\'s everything. Now go make some noise.',
    sticker: '/stickers/yoru_point.webp',
  },
]

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 8
const DIE_CUT =
  'grayscale(1) contrast(1.12) drop-shadow(2.5px 0 0 #fff) drop-shadow(-2.5px 0 0 #fff) drop-shadow(0 2.5px 0 #fff) ' +
  'drop-shadow(0 -2.5px 0 #fff) drop-shadow(3px 5px 4px rgba(0,0,0,0.4))'

function findTarget(step: TourStep): HTMLElement | null {
  if (!step.target) return null
  for (const name of step.target.split(',').map(s => s.trim())) {
    const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`))
      .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
    if (all.length) return (step.pick === 'last' ? all[all.length - 1] : all[0]) ?? null
  }
  return null
}

interface TutorialProps {
  open: boolean
  onClose: () => void
  steps?: TourStep[]
}

export default function Tutorial({ open, onClose, steps = TOUR_STEPS }: TutorialProps) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [vw, setVw] = useState(() => window.innerWidth)
  const [vh, setVh] = useState(() => window.innerHeight)

  useEffect(() => { if (open) setIndex(0) }, [open])

  const step = steps[index]

  const measure = useCallback(() => {
    setVw(window.innerWidth)
    setVh(window.innerHeight)
    if (!step) return
    const el = findTarget(step)
    if (!el) { setRect(null); return }
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const r = el.getBoundingClientRect()
    // keep the ring fully on screen (inputs sit right at the bottom edge)
    const top = Math.max(4, r.top - PAD)
    const left = Math.max(4, r.left - PAD)
    const bottom = Math.min(window.innerHeight - 4, r.bottom + PAD)
    const right = Math.min(window.innerWidth - 4, r.right + PAD)
    setRect({ top, left, width: right - left, height: bottom - top })
  }, [step])

  // a step that points at something that isn't on screen (e.g. no messages yet) gets skipped
  const [dir, setDir] = useState<1 | -1>(1)
  useLayoutEffect(() => {
    if (!open || !step) return
    if (step.target && !findTarget(step)) {
      const next = index + dir
      if (next < 0 || next >= steps.length) onClose()
      else setIndex(next)
      return
    }
    measure()
    const t = setTimeout(measure, 250) // let animations / fonts settle
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [open, index, step, dir, measure, steps.length, onClose])

  const go = useCallback((d: 1 | -1) => {
    setDir(d)
    const next = index + d
    if (next >= steps.length) onClose()
    else if (next >= 0) setIndex(next)
  }, [index, steps.length, onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); go(1) }
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go, onClose])

  if (!open || !step) return null

  const isMobile = vw < 640
  const cardW = Math.min(340, vw - 24)
  const centered = !step.target || !rect

  // card goes under the spotlight if there's room, otherwise above it
  let cardTop = vh / 2 - 110
  let cardLeft = vw / 2 - cardW / 2
  if (!centered && rect) {
    const below = rect.top + rect.height + 18
    const fitsBelow = below + 230 < vh
    cardTop = fitsBelow ? below : Math.max(12, rect.top - 230 - 18)
    cardLeft = Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 12)
  }

  const hole: Rect = centered
    ? { top: vh / 2, left: vw / 2, width: 0, height: 0 }
    : (rect as Rect)
  const last = index === steps.length - 1

  return (
    <div
      role="dialog" aria-modal aria-label="Tutorial"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'auto', '--accent': '#111', '--on-accent': '#f5f2ea', '--paper': '#f5f2ea', '--ink': '#111' } as CSSProperties}
    >
      {/* spotlight: a box whose huge shadow is the dim layer, so the "hole" is the target */}
      <motion.div
        initial={false}
        animate={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        style={{
          position: 'fixed',
          borderRadius: 16,
          boxShadow: '0 0 0 9999px rgba(10, 10, 10, 0.78)',
          border: centered ? 'none' : '3px solid #f5f2ea',
          pointerEvents: 'none',
        }}
      >
        {!centered && (
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            style={{ position: 'absolute', inset: -8, borderRadius: 20, border: '3px solid #f5f2ea' }}
          />
        )}
      </motion.div>

      {/* speech card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 14, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          style={{
            position: 'fixed', top: cardTop, left: cardLeft, width: cardW,
            background: '#f5f2ea', color: '#111',
            border: '3px solid #111', borderRadius: 18,
            boxShadow: '5px 5px 0 #111',
            backgroundImage: 'none',
            padding: isMobile ? '16px 16px 14px' : '18px 20px 16px',
            paddingRight: isMobile ? 92 : 108,
            minHeight: 150,
          }}
        >
          {/* the character "talking" — slapped onto the card corner */}
          <motion.img
            src={step.sticker} alt="" draggable={false}
            initial={{ scale: 1.4, rotate: 22, opacity: 0 }}
            animate={{ scale: 1, rotate: 8, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 15, delay: 0.08 }}
            style={{
              position: 'absolute', right: -22, top: -38,
              width: isMobile ? 110 : 130, height: isMobile ? 110 : 130,
              objectFit: 'contain', filter: DIE_CUT, pointerEvents: 'none',
              ...(step.sticker.endsWith('.jpg') ? {
                objectFit: 'cover', borderRadius: 14, border: '4px solid #fff',
                filter: 'grayscale(1) contrast(1.12) drop-shadow(3px 5px 4px rgba(0,0,0,0.4))', background: '#fff',
              } : {}),
            }}
          />

          <div style={{
            fontFamily: 'BlambotClassic, sans-serif', fontSize: isMobile ? 20 : 22,
            letterSpacing: 2, color: 'var(--accent)', marginBottom: 6, lineHeight: 1.1,
          }}>
            {step.title}
          </div>
          <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: isMobile ? 11 : 12, lineHeight: 1.55 }}>
            {step.text}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            {/* progress dots */}
            <div style={{ display: 'flex', gap: 4, flex: 1 }}>
              {steps.map((_, i) => (
                <div key={i} style={{
                  width: i === index ? 16 : 7, height: 7, borderRadius: 999,
                  background: i === index ? 'var(--accent)' : i < index ? '#111' : '#ccc',
                  transition: 'all 0.2s',
                }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, marginRight: isMobile ? -76 : -88 }}>
            {!last && (
              <button onClick={onClose} style={btn('ghost')}>SKIP</button>
            )}
            <div style={{ flex: 1 }} />
            {index > 0 && <button onClick={() => go(-1)} style={btn('ghost')}>BACK</button>}
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => go(1)} style={btn('main')}>
              {last ? "LET'S GO 🪚" : 'NEXT →'}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function btn(kind: 'main' | 'ghost'): CSSProperties {
  return {
    padding: '8px 14px',
    background: kind === 'main' ? 'var(--accent)' : 'transparent',
    color: kind === 'main' ? 'var(--on-accent)' : '#111',
    border: `2px solid ${kind === 'main' ? '#111' : 'transparent'}`,
    boxShadow: kind === 'main' ? '3px 3px 0 #111' : 'none',
    fontFamily: 'BlambotClassic, sans-serif', fontSize: 14, letterSpacing: 1.5,
    cursor: 'pointer',
  }
}
