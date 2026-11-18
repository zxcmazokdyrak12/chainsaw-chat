import type { CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Splat } from '../hooks/useBerserk'
import { TIERS } from '../hooks/useBerserk'

// tiny seeded RNG so a splat keeps its shape while it re-renders
function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

// an ink blot: a lumpy core, a few thrown droplets and a drip or two
function InkSplat({ seed }: { seed: number }) {
  const r = rng(seed)
  const pts: string[] = []
  const n = 18
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const rad = 30 + r() * 16 + (r() < 0.25 ? 14 + r() * 18 : 0) // occasional spike
    pts.push(`${50 + Math.cos(a) * rad},${50 + Math.sin(a) * rad}`)
  }
  const drops = Array.from({ length: 7 + Math.floor(r() * 6) }, () => {
    const a = r() * Math.PI * 2, d = 50 + r() * 42
    return { x: 50 + Math.cos(a) * d, y: 50 + Math.sin(a) * d, r: 1.5 + r() * 5 }
  })
  const drip = { x: 40 + r() * 20, len: 18 + r() * 30 }
  return (
    <svg viewBox="-20 -20 140 160" width="100%" height="100%" aria-hidden style={{ overflow: 'visible' }}>
      <polygon points={pts.join(' ')} fill="var(--ink)" strokeLinejoin="round" stroke="var(--ink)" strokeWidth="6" />
      {drops.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="var(--ink)" />)}
      <path d={`M${drip.x} 70 q 2 ${drip.len / 2} 0 ${drip.len}`} stroke="var(--ink)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx={drip.x} cy={70 + drip.len} r="5" fill="var(--ink)" />
    </svg>
  )
}

// chain scratches: three torn strokes with saw-tooth notches, like the chain dragged across the page
function ChainScratch({ seed }: { seed: number }) {
  const r = rng(seed)
  const strokes = [0, 1, 2].map(k => {
    const y = 30 + k * 18 + r() * 6
    let d = `M 0 ${y}`
    for (let x = 12; x <= 160; x += 12) d += ` L ${x} ${y + (x % 24 === 0 ? -5 : 4) + (r() - 0.5) * 3}`
    return d
  })
  return (
    <svg viewBox="0 0 160 100" width="100%" height="100%" aria-hidden style={{ overflow: 'visible' }}>
      {strokes.map((d, i) => (
        <g key={i}>
          <path d={d} stroke="var(--ink)" strokeWidth={6 - i} fill="none" strokeLinecap="round" strokeLinejoin="bevel" />
          <path d={d} stroke="var(--paper)" strokeWidth="1.3" fill="none" strokeDasharray="3 9" transform="translate(0,-1)" />
        </g>
      ))}
    </svg>
  )
}

function place(s: Splat): CSSProperties {
  const half = s.size / 2
  const base: CSSProperties = { position: 'absolute', width: s.size, height: s.size, pointerEvents: 'none' }
  if (s.side === 'top') return { ...base, top: -half * 0.6, left: `calc(${s.pos}% - ${half}px)` }
  if (s.side === 'bottom') return { ...base, bottom: -half * 0.6, left: `calc(${s.pos}% - ${half}px)` }
  if (s.side === 'left') return { ...base, left: -half * 0.6, top: `calc(${s.pos}% - ${half}px)` }
  return { ...base, right: -half * 0.6, top: `calc(${s.pos}% - ${half}px)` }
}

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

export default function BerserkLayer({ combo, active, tier, splats, cooling }: {
  combo: number; active: boolean; tier: number; splats: Splat[]; cooling: boolean
}) {
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return (
    <div aria-hidden={!active && !cooling} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 5 }}>
      <AnimatePresence>
        {!reduced && splats.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0.3, rotate: s.rot }}
            animate={{ opacity: 0.92, scale: 1, rotate: s.rot }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.12 }}
            style={place(s)}
          >
            {s.kind === 'ink' ? <InkSplat seed={s.seed} /> : <ChainScratch seed={s.seed} />}
          </motion.div>
        ))}
      </AnimatePresence>
      {/* a vignette that darkens the edges at the top tiers */}
      {active && tier >= 2 && (
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: `inset 0 0 ${tier >= 3 ? 90 : 50}px ${tier >= 3 ? 26 : 12}px color-mix(in srgb, var(--ink) ${tier >= 3 ? 55 : 35}%, transparent)`,
          transition: 'box-shadow .3s',
        }} />
      )}
      <AnimatePresence>
        {(active || cooling) && <Tacho key="tacho" combo={combo} tier={tier} cooling={cooling} reduced={reduced} />}
      </AnimatePresence>
    </div>
  )
}
