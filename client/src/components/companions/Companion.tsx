import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import CompanionArt, { type CompanionKind, type Mood } from './art'
import { useT } from '../../lib/i18n'

// The little devil peeking over the input panel. It sits in the panel's wrapper,
// one z-index below the panel, so the panel hides its feet.
export default function Companion({ kind, mood, onPoke, left = 18 }: {
  kind: CompanionKind; mood: Mood; onPoke: () => void; left?: number
}) {
  const t = useT()
  const reduce = useReducedMotion()
  return (
    <div style={{ position: 'absolute', left: `${left}px`, bottom: 'calc(100% - 8px)', zIndex: 1, width: '64px', height: '64px' }}>
      <AnimatePresence>
        {mood === 'panic' && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.6, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6 }}
            style={{
              position: 'absolute', left: '54px', bottom: '46px', whiteSpace: 'nowrap',
              background: 'var(--paper)', color: 'var(--ink)', border: '2.5px solid var(--ink)',
              borderRadius: '50% / 45%', padding: '6px 12px', boxShadow: '2px 2px 0 var(--ink)',
              fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', letterSpacing: '0.5px',
              transform: 'rotate(-3deg)', pointerEvents: 'none',
            }}
          >
            {t('Where did the server go?!')}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        key={mood}
        type="button"
        onClick={onPoke}
        title={t('Poke it')}
        aria-label={t('Your companion — poke it')}
        initial={reduce ? false : { y: 10 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 20 }}
        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'block' }}
      >
        <CompanionArt kind={kind} mood={mood} size={64} />
      </motion.button>
    </div>
  )
}
