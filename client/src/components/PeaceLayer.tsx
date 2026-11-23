import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useT } from '../lib/i18n'

// Peaceful life: warm evening light over the feed + three photos taped to the "fridge" in the corner.
// Tap a photo to bring it to the front, tap the front one to open it big.
// When the saw comes back each photo peels off and flies away on its own.
const PHOTOS = [
  { src: '/peace/aquarium.jpg', alt: 'Aki, Denji and Power at the aquarium', rotate: -6, x: -4, y: 0 },
  { src: '/peace/dinner.jpg', alt: 'Dinner at home', rotate: 5, x: -96, y: 150 },
  { src: '/peace/sleep.jpg', alt: 'The three of them asleep', rotate: -3, x: -14, y: 196 },
] as const

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

interface Props {
  active: boolean
  isMobile: boolean
  onOpen: (src: string) => void
}

export default function PeaceLayer({ active, isMobile, onOpen }: Props) {
  const t = useT()
  const [front, setFront] = useState(0)
  const [folded, setFolded] = useState(false)
  const still = reduced()
  const w = isMobile ? 92 : 140
  const k = isMobile ? 0.65 : 1

  return (
    <AnimatePresence onExitComplete={() => { setFront(0); setFolded(false) }}>
      {active && (
        <>
          {/* evening light: an amber wash + a lamp glow from the top-left. In slowly, out at once. */}
          <motion.div
            key="peace-light"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: still ? 0 : 2.5, ease: 'easeInOut' } }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            style={{
              position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
              background: [
                'radial-gradient(ellipse at 12% 0%, rgba(255,214,150,0.45), transparent 60%)',
                'linear-gradient(180deg, rgba(255,176,102,0.20), rgba(214,120,60,0.16))',
              ].join(','),
              mixBlendMode: 'soft-light',
            }}
          />
          <motion.div
            key="peace-tint"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: still ? 0 : 2.5 } }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            style={{
              position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
              background: 'rgba(255,170,90,0.10)', mixBlendMode: 'multiply',
              boxShadow: 'inset 0 0 120px rgba(120,60,20,0.25)',
            }}
          />

          {/* the fridge corner */}
          <motion.div
            key="peace-photos"
            role="group"
            aria-label={t('Peaceful life')}
            style={{ position: 'absolute', top: 10, right: isMobile ? 8 : 16, width: w + 100 * k, height: folded ? 34 : w * 1.5 + 230 * k, zIndex: 5, pointerEvents: 'none' }}
          >
            <motion.button
              type="button"
              onClick={() => setFolded(f => !f)}
              title={folded ? t('Show the photos') : t('Fold the photos away')}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: still ? 0 : 1.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              style={{
                position: 'absolute', top: 0, right: 0, zIndex: 10, pointerEvents: 'auto', cursor: 'pointer',
                font: `700 ${isMobile ? 11 : 13}px/1 inherit`, letterSpacing: 1,
                padding: '5px 9px', border: '2px solid var(--ink)', borderRadius: 3,
                background: 'rgba(255,236,200,0.92)', color: '#5a3415', transform: 'rotate(3deg)',
              }}
            >
              {folded ? '🏠 ただいま' : 'ただいま'}
            </motion.button>

            {!folded && PHOTOS.map((p, i) => {
              const z = i === front ? 3 : i < front ? 1 : 2
              const flyX = (i - 1) * 160 + 120
              return (
                <motion.button
                  key={p.src}
                  type="button"
                  aria-label={p.alt}
                  onClick={() => (i === front ? onOpen(p.src) : setFront(i))}
                  initial={{ opacity: 0, y: -40, rotate: p.rotate - 12, scale: 0.9 }}
                  animate={{
                    opacity: 1, y: p.y * k, x: p.x * k, scale: 1,
                    rotate: still ? p.rotate : [p.rotate - 1.2, p.rotate + 1.2, p.rotate - 1.2],
                    transition: {
                      opacity: { delay: still ? 0 : 0.6 + i * 0.35, duration: 0.6 },
                      y: { delay: still ? 0 : 0.6 + i * 0.35, type: 'spring', stiffness: 120, damping: 14 },
                      scale: { delay: still ? 0 : 0.6 + i * 0.35 },
                      rotate: still ? { duration: 0 } : { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
                    },
                  }}
                  // peeled off and blown away
                  exit={{
                    opacity: 0, x: flyX, y: -220 - i * 40, rotate: p.rotate + (i % 2 ? 70 : -60), scale: 0.8,
                    transition: { duration: still ? 0.1 : 0.7, delay: still ? 0 : i * 0.08, ease: [0.4, 0, 0.9, 0.6] },
                  }}
                  style={{
                    position: 'absolute', top: 24, right: 0, width: w, padding: `${5 * k}px ${5 * k}px ${16 * k}px`,
                    background: '#fbf7ee', border: 'none', borderRadius: 2, cursor: 'pointer', zIndex: z,
                    boxShadow: '0 6px 14px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.2)', pointerEvents: 'auto',
                  }}
                >
                  {/* a strip of tape */}
                  <span aria-hidden style={{
                    position: 'absolute', top: -8 * k, left: '50%', width: 46 * k, height: 16 * k,
                    transform: `translateX(-50%) rotate(${i % 2 ? 6 : -5}deg)`,
                    background: 'rgba(255,240,200,0.7)', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  }} />
                  <img src={p.src} alt="" draggable={false} style={{ display: 'block', width: '100%', height: 'auto', filter: 'sepia(0.25) saturate(1.1)' }} />
                </motion.button>
              )
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
