import type { CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TIERS } from '../hooks/useBerserk'

// a tachometer: 0–12 ×1000 rpm, red zone from 9. The needle is the combo.
function Tacho({ combo, tier, cooling, reduced }: { combo: number; tier: number; cooling: boolean; reduced: boolean }) {
  const value = cooling ? 0 : Math.min(combo, 12.4) // pegged just past the limit
  const angle = -120 + (value / 12) * 240
  const name = tier > 0 ? TIERS[tier - 1]!.name : ''
  const arc = (from: number, to: number, r: number) => {
    const p = (deg: number) => { const a = ((deg - 90) * Math.PI) / 180; return `${60 + Math.cos(a) * r} ${60 + Math.sin(a) * r}` }
    return `M ${p(from)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${p(to)}`
  }
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={cooling ? 'Combo over' : `Combo ${combo}${name ? `, ${name}` : ''}`}
      initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{ position: 'absolute', right: 10, bottom: 12, width: 132, height: 140, zIndex: 6, pointerEvents: 'none', color: 'var(--ink)' }}
    >
      <svg viewBox="0 0 120 120" width="132" height="132" aria-hidden>
        <circle cx="60" cy="60" r="56" fill="var(--paper)" stroke="var(--ink)" strokeWidth="4" />
        {/* red zone */}
        <path d={arc(60, 120, 46)} stroke="var(--blood)" strokeWidth="9" fill="none" />
        {Array.from({ length: 13 }, (_, i) => {
          const a = ((-120 + i * 20 - 90) * Math.PI) / 180
          const long = i % 2 === 0
          return (
            <g key={i}>
              <line x1={60 + Math.cos(a) * (long ? 38 : 42)} y1={60 + Math.sin(a) * (long ? 38 : 42)} x2={60 + Math.cos(a) * 50} y2={60 + Math.sin(a) * 50} stroke="var(--ink)" strokeWidth={long ? 3 : 1.5} />
              {long && <text x={60 + Math.cos(a) * 29} y={63 + Math.sin(a) * 29} textAnchor="middle" fontSize="8" fill="var(--ink)" style={{ fontFamily: 'BlambotClassic, sans-serif' }}>{i}</text>}
            </g>
          )
        })}
        <text x="60" y="45" textAnchor="middle" fontSize="5.5" fill="var(--ink)" style={{ fontFamily: "'AnimeAce', sans-serif" }}>×1000 r/min</text>
        {/* needle — springs to the combo, shivers in the red zone */}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '60px 60px', transformBox: 'view-box', transition: `transform ${cooling ? '.8s ease-in' : '.35s cubic-bezier(.3,1.7,.5,1)'}` } as CSSProperties}>
          <g className={value >= 9 && !reduced ? 'csm-needle-shiver' : undefined} style={{ transformOrigin: '60px 60px', transformBox: 'view-box' } as CSSProperties}>
            <path d="M 57 62 L 60 14 L 63 62 Z" fill="var(--blood)" stroke="var(--ink)" strokeWidth="1.5" />
          </g>
        </g>
        <circle cx="60" cy="60" r="7" fill="var(--ink)" />
      </svg>
      {/* the count sits in the dial's empty lower half, the tier name rides the rim */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 84, textAlign: 'center', lineHeight: 1 }}>
        <motion.div
          key={combo}
          initial={reduced ? false : { scale: 1.6 }}
          animate={{ scale: 1 }}
          style={{
            fontFamily: "'DeathRattle', 'BlambotClassic', sans-serif", fontSize: '26px', color: 'var(--paper)',
            WebkitTextStroke: '1.5px var(--ink)', textShadow: '2px 2px 0 var(--ink)',
          }}
        >
          {cooling ? 'brrr…' : `×${combo}`}
        </motion.div>
        {name && !cooling && (
          <div style={{ marginTop: 6, display: 'inline-block', padding: '1px 6px', transform: 'rotate(-4deg)', background: 'var(--ink)', color: 'var(--paper)', fontFamily: 'BlambotClassic, sans-serif', fontSize: '11px', letterSpacing: '2px' }}>
            {name}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// berserk mode: just the rev counter in the corner of the feed
export default function BerserkLayer({ combo, active, tier, cooling }: {
  combo: number; active: boolean; tier: number; cooling: boolean
}) {
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return (
    <AnimatePresence>
      {(active || cooling) && <Tacho key="tacho" combo={combo} tier={tier} cooling={cooling} reduced={reduced} />}
    </AnimatePresence>
  )
}
