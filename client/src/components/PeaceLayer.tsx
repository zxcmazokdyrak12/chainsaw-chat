import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SCENE } from '../hooks/usePeace'
import { useT } from '../lib/i18n'

// Peaceful life: the chat fades to black, a beat of silence, then a quiet panel —
// a low table in a sunlit room, three mugs, sparrows outside. Then it fades and the chat is back.
// Drop your own panel at client/public/peace/panel.png and it replaces the drawing.
const PANEL_SRC = '/peace/panel.png'

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

type Phase = 'dark' | 'panel' | 'out'

export default function PeaceLayer({ active, onSkip }: { active: boolean; onSkip: () => void }) {
  if (!active) return null
  return <Scene onSkip={onSkip} />
}

function Scene({ onSkip }: { onSkip: () => void }) {
  const t = useT()
  const [phase, setPhase] = useState<Phase>('dark')
  const [useDrawing, setUseDrawing] = useState(false)
  const still = reduced()

  useEffect(() => {
    const a = setTimeout(() => setPhase('panel'), SCENE.panelIn)
    const b = setTimeout(() => setPhase('out'), SCENE.fadeOut)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onSkip() }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(a); clearTimeout(b); window.removeEventListener('keydown', onKey) }
  }, [onSkip])

  const outS = (SCENE.end - SCENE.fadeOut) / 1000
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t('Peaceful life')}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'out' ? 0 : 1 }}
      transition={{ duration: still ? 0 : phase === 'out' ? outS : SCENE.dark / 1000, ease: 'easeInOut' }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: '#050505',
        display: 'grid', placeItems: 'center', padding: '4vmin',
      }}
    >
      <motion.figure
        initial={{ opacity: 0, scale: still ? 1 : 1.04 }}
        animate={phase === 'dark' ? { opacity: 0 } : { opacity: 1, scale: 1 }}
        transition={{ duration: still ? 0 : 1.6, ease: 'easeOut' }}
        style={{
          margin: 0, width: 'min(92vw, 820px, calc(88vh * 1.6))', aspectRatio: '16 / 10',
          background: '#fff', border: '6px solid #000', outline: '3px solid #f4efe4', outlineOffset: 4,
          boxShadow: '0 0 80px rgba(255,214,150,0.18)', overflow: 'hidden', position: 'relative',
        }}
      >
        {useDrawing ? (
          <TablePanel still={still} />
        ) : (
          <img
            src={PANEL_SRC}
            alt=""
            onError={() => setUseDrawing(true)}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </motion.figure>
    </motion.div>
  )
}

// An original manga-style panel, drawn in SVG: ink lines, dot screentone, light from the window.
function TablePanel({ still }: { still: boolean }) {
  const mugs = [
    { x: 330, kind: 'stripes' as const },
    { x: 430, kind: 'tone' as const },
    { x: 530, kind: 'plain' as const },
  ]
  return (
    <svg viewBox="0 0 800 500" width="100%" height="100%" aria-hidden style={{ display: 'block' }}>
      <defs>
        <pattern id="pz-tone" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="3" cy="3" r="1.15" fill="#111" />
        </pattern>
        <pattern id="pz-tone-light" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="3.5" cy="3.5" r="0.8" fill="#111" />
        </pattern>
        <pattern id="pz-dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1.6" fill="#111" />
        </pattern>
        <style>{`
          .pz-ink { stroke: #000; stroke-linecap: round; stroke-linejoin: round; fill: none; }
          .pz-steam { animation: pz-rise 4.5s ease-in-out infinite; opacity: 0; }
          @keyframes pz-rise { 0% { opacity: 0; transform: translateY(8px) } 30% { opacity: .9 } 100% { opacity: 0; transform: translateY(-26px) } }
          .pz-curtain { transform-box: fill-box; transform-origin: top center; animation: pz-sway 6s ease-in-out infinite; }
          @keyframes pz-sway { 0%,100% { transform: skewX(0deg) } 50% { transform: skewX(-2.5deg) } }
          .pz-sfx { animation: pz-pop 3.2s ease-in-out infinite; }
          .pz-sfx.b { animation-delay: 1.1s }
          @keyframes pz-pop { 0%,100% { opacity: .15 } 20%,45% { opacity: 1 } }
          ${still ? '.pz-steam,.pz-curtain,.pz-sfx { animation: none !important; opacity: 1 }' : ''}
        `}</style>
      </defs>

      {/* wall in shade, the window throws a block of light across it and the floor */}
      <rect width="800" height="500" fill="#fff" />
      <rect width="800" height="300" fill="url(#pz-tone)" opacity="0.55" />
      <polygon points="60,40 290,40 470,300 150,300" fill="#fff" />

      {/* floor and tatami seams */}
      <rect x="0" y="302" width="800" height="198" fill="url(#pz-tone-light)" opacity="0.35" />
      <polygon points="150,302 470,302 640,500 210,500" fill="#fff" />
      {[-140, 60, 260, 520, 740, 940].map((x, i) => (
        <line key={i} className="pz-ink" x1={400 + (x - 400) * 0.45} y1="302" x2={x} y2="500" strokeWidth="1.5" opacity="0.6" />
      ))}
      <line className="pz-ink" x1="0" y1="300" x2="800" y2="300" strokeWidth="4" />

      {/* window: frame, mullions, two sparrows on the wire outside */}
      <rect className="pz-ink" x="60" y="40" width="230" height="210" strokeWidth="6" />
      <line className="pz-ink" x1="175" y1="40" x2="175" y2="250" strokeWidth="4" />
      <line className="pz-ink" x1="60" y1="145" x2="290" y2="145" strokeWidth="4" />
      <path className="pz-ink" d="M60 95 Q175 120 290 88" strokeWidth="1.5" />
      <g fill="#000">
        <ellipse cx="118" cy="101" rx="9" ry="6" /><circle cx="126" cy="96" r="4.5" /><path d="M109 101 l-9 4 l9 1z" />
        <ellipse cx="236" cy="98" rx="8" ry="5.5" /><circle cx="229" cy="93" r="4" /><path d="M244 98 l8 4 l-8 1z" />
      </g>
      <rect className="pz-ink" x="48" y="250" width="254" height="12" strokeWidth="4" fill="#fff" />

      {/* curtain */}
      <g className="pz-curtain">
        <path d="M292 30 C300 90 284 150 296 210 C304 250 290 270 300 285 L340 285 C328 240 344 180 330 120 C322 80 336 50 328 30 Z" fill="#fff" stroke="#000" strokeWidth="3" />
        <path className="pz-ink" d="M306 40 C312 100 300 160 310 220 M318 40 C322 110 314 170 322 270" strokeWidth="1.5" />
      </g>
      <line className="pz-ink" x1="40" y1="30" x2="360" y2="30" strokeWidth="5" />

      {/* chirp chirp */}
      <text className="pz-sfx" x="150" y="78" fontSize="30" fontWeight="900" fill="#000" stroke="#fff" strokeWidth="5" paintOrder="stroke" transform="rotate(-10 150 78)">チュン</text>
      <text className="pz-sfx b" x="222" y="198" fontSize="24" fontWeight="900" fill="#000" stroke="#fff" strokeWidth="5" paintOrder="stroke" transform="rotate(8 222 198)">チュン</text>

      {/* low round table */}
      <ellipse cx="430" cy="440" rx="250" ry="34" fill="url(#pz-tone)" opacity="0.7" />
      <path className="pz-ink" d="M250 388 L250 440 M610 388 L610 440 M330 405 L330 452 M530 405 L530 452" strokeWidth="9" />
      <path d="M180 360 L180 376 A250 62 0 0 0 680 376 L680 360 Z" fill="#fff" stroke="#000" strokeWidth="5" />
      <ellipse cx="430" cy="360" rx="250" ry="62" fill="#fff" stroke="#000" strokeWidth="5" />
      <path className="pz-ink" d="M230 352 Q330 330 420 336 M470 380 Q560 384 630 366 M290 384 Q350 392 400 390" strokeWidth="1.3" opacity="0.7" />

      {/* three mugs */}
      {mugs.map((m, i) => (
        <g key={i}>
          <ellipse cx={m.x} cy="370" rx="36" ry="8" fill="url(#pz-tone)" opacity="0.8" />
          <path d={`M${m.x + 26} 322 C${m.x + 52} 322 ${m.x + 52} 356 ${m.x + 24} 356`} className="pz-ink" strokeWidth="6" />
          <path d={`M${m.x - 28} 302 L${m.x - 28} 360 A28 9 0 0 0 ${m.x + 28} 360 L${m.x + 28} 302 Z`} fill="#fff" stroke="#000" strokeWidth="4.5" />
          {m.kind === 'stripes' && [318, 334, 350].map(y => (
            <path key={y} d={`M${m.x - 28} ${y} A28 8 0 0 0 ${m.x + 28} ${y}`} className="pz-ink" strokeWidth="4" />
          ))}
          {m.kind === 'tone' && <path d={`M${m.x + 4} 304 L${m.x + 4} 368 A28 9 0 0 0 ${m.x + 26} 362 L${m.x + 26} 304 Z`} fill="url(#pz-tone)" />}
          {m.kind === 'plain' && <path d={`M${m.x - 8} 332 l8 -9 l8 9 l-8 9z`} fill="url(#pz-dots)" stroke="#000" strokeWidth="2" />}
          <ellipse cx={m.x} cy="302" rx="28" ry="9" fill="#fff" stroke="#000" strokeWidth="4.5" />
          <ellipse cx={m.x} cy="303.5" rx="22" ry="6" fill="#111" />
          <ellipse cx={m.x - 7} cy="302" rx="6" ry="1.6" fill="#fff" opacity="0.8" />
          {[0, 1, 2].map(s => (
            <path key={s} className="pz-ink pz-steam" strokeWidth="2.2"
              d={`M${m.x - 10 + s * 10} 288 c-8 -10 8 -16 0 -26 c-7 -9 6 -14 1 -22`}
              style={{ animationDelay: `${i * 0.6 + s * 1.4}s` }} />
          ))}
        </g>
      ))}

      <rect x="6" y="6" width="788" height="488" fill="none" stroke="#000" strokeWidth="2" />
    </svg>
  )
}
