import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import CompanionArt, { type CompanionKind } from './art'
import { useT } from '../../lib/i18n'

export interface CameoRun { id: number; empty: boolean }

// "ням" → the companion leans in from the right edge, mouth open, and swallows the narration boxes
export default function Cameo({ kind, run }: { kind: CompanionKind; run: CameoRun | null }) {
  const t = useT()
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {run && (
        <motion.div
          key={run.id}
          aria-hidden="true"
          initial={reduce ? { opacity: 0 } : { x: '110%' }}
          animate={reduce ? { opacity: [0, 1, 1, 0] } : { x: ['110%', '6%', '6%', '110%'] }}
          transition={{ duration: 1.7, times: [0, 0.22, 0.78, 1], ease: 'easeInOut' }}
          style={{ position: 'absolute', right: 0, bottom: '16%', zIndex: 25, pointerEvents: 'none', display: 'flex', alignItems: 'flex-start' }}
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: 'spring', stiffness: 500, damping: 18 }}
            style={{
              marginTop: '8px', marginRight: '-14px', whiteSpace: 'nowrap',
              background: 'var(--paper)', color: 'var(--ink)', border: '3px solid var(--ink)',
              borderRadius: run.empty ? '50% / 45%' : '4px', padding: run.empty ? '8px 14px' : '4px 10px',
              boxShadow: '3px 3px 0 var(--ink)',
              fontFamily: run.empty ? "'AnimeAce', sans-serif" : "'CCDoohickey', BlambotClassic, sans-serif",
              fontSize: run.empty ? '11px' : '22px', fontStyle: run.empty ? 'normal' : 'italic', fontWeight: 900,
              transform: 'rotate(-6deg)',
            }}
          >
            {run.empty ? t('…nothing to eat.') : 'CHOMP!'}
          </motion.div>
          <div style={{ transform: 'rotate(-12deg)', filter: 'drop-shadow(4px 4px 0 var(--paper))' }}>
            <CompanionArt kind={kind} mood="hype" size={170} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
