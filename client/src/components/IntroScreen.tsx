import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'

// "Chapter 0": the way into the chat.
// 1) first visit only — three manga panels pop in (BRRRM, the eyes, CHAPTER 0)
// 2) a pull-cord starter: drag the handle down and let go; it sputters twice, starts on the 3rd pull
// 3) the engine roars, and <SlashOverlay> cuts the screen open on top of the login page
// Skip button, Enter/Space and "reduce motion" all lead to the same place.

const INK = '#f2efe6'
const BG = '#0e0e0e'
const SEEN_KEY = 'chainsaw_intro_seen'
const PULLS_TO_START = 3
const PULL_DISTANCE = 100 // px the handle has to travel to count

interface IntroScreenProps {
  soundOn: boolean
  onRoar: () => void   // play the chainsaw sound
  onDone: () => void   // go to the login page (the slash plays over it)
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// tiny two-stroke "put" synthesized on the fly — no extra audio files
function useSputter(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)
  return useCallback((bursts: number) => {
    if (!enabled) return
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = ctxRef.current ?? (ctxRef.current = new AC())
      const t0 = ctx.currentTime
      for (let i = 0; i < bursts; i++) {
        const t = t0 + i * 0.14
        const osc = ctx.createOscillator()
        const filter = ctx.createBiquadFilter()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(70 - i * 6, t)
        filter.type = 'lowpass'
        filter.frequency.value = 650
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(0.35, t + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11)
        osc.connect(filter).connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.13)
      }
    } catch { /* no audio — fine */ }
  }, [enabled])
}

function shake(el: HTMLElement | null, px: number, ms = 60, times = 5) {
  el?.animate(
    [
      { transform: 'translate(0,0)' },
      { transform: `translate(${-px}px,${px / 2}px)` },
      { transform: `translate(${px}px,${-px / 2}px)` },
      { transform: `translate(${-px / 2}px,${-px}px)` },
      { transform: 'translate(0,0)' },
    ],
    { duration: ms, iterations: times },
  )
}

// big comic lettering that pops and fades
function Sfx({ text, size, side }: { text: string; size: number; side?: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
      animate={{ scale: [0.4, 1.15, 1], rotate: -6, opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'absolute', left: side ? '72%' : '50%', top: side ? '30%' : '40%', x: '-50%', y: '-50%',
        fontFamily: "'DeathRattle', 'BlambotClassic', sans-serif", fontSize: size,
        color: INK, WebkitTextStroke: '2px #111', textShadow: '5px 5px 0 #000',
        whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
      }}
    >
      {text}
    </motion.div>
  )
}

const SPEED_LINES: CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none',
  background: `repeating-conic-gradient(from 0deg at 50% 50%, ${INK} 0deg 1deg, transparent 1deg 6deg)`,
  WebkitMaskImage: 'radial-gradient(circle, transparent 30%, #000 70%)',
  maskImage: 'radial-gradient(circle, transparent 30%, #000 70%)',
}

// ── cold open ────────────────────────────────────────────────────

function Panels({ onNext }: { onNext: () => void }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const ts = [250, 950, 1650].map((ms, i) => setTimeout(() => setShown(i + 1), ms))
    const end = setTimeout(onNext, 3300)
    return () => { ts.forEach(clearTimeout); clearTimeout(end) }
  }, [onNext])

  const panel = (i: number, style: CSSProperties, children: ReactNode) => (
    <div style={{
      position: 'absolute', border: `4px solid ${INK}`, background: '#f5f2ea', color: '#111', overflow: 'hidden',
      opacity: shown > i ? 1 : 0, transform: shown > i ? 'none' : 'scale(1.15) rotate(-2deg)',
      transition: 'opacity .25s, transform .35s cubic-bezier(.2,1.4,.4,1)', ...style,
    }}>
      {children}
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: '12px' }}>
      {panel(0, { left: 0, top: 0, width: 'calc(56% - 6px)', height: 'calc(55% - 6px)' }, <>
        <div style={{ ...SPEED_LINES, background: 'repeating-conic-gradient(from 0deg at 50% 60%, #111 0deg 1.2deg, transparent 1.2deg 7deg)', WebkitMaskImage: 'none', maskImage: 'none' }} />
        <div style={{ position: 'absolute', left: '50%', top: '55%', transform: 'translate(-50%,-50%) rotate(-8deg)', fontFamily: "'DeathRattle', 'BlambotClassic', sans-serif", fontSize: 'clamp(40px, 9vw, 96px)', color: '#f5f2ea', WebkitTextStroke: '3px #111' }}>BRRRM</div>
      </>)}
      {panel(1, { right: 0, top: 0, width: 'calc(44% - 6px)', height: 'calc(55% - 6px)' }, <>
        <img src="/stickers/crop_makima_eyes.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.2)' }} />
      </>)}
      {panel(2, { left: 0, bottom: 0, width: '100%', height: 'calc(45% - 6px)' }, <>
        <div className="tone" style={{ position: 'absolute', inset: 0, opacity: 0.6, '--tone-dot': '#111' } as CSSProperties} />
        <div style={{ position: 'absolute', left: '6%', top: '50%', transform: 'translateY(-50%) rotate(-3deg)', fontFamily: 'BlambotClassic, sans-serif', fontSize: 'clamp(30px, 6vw, 64px)', letterSpacing: '4px', background: '#f5f2ea', border: '4px solid #111', padding: '0 16px' }}>CHAPTER 0</div>
        <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%) rotate(4deg)', border: '4px solid #111', borderRadius: '50% / 50%', padding: '14px 26px', background: '#f5f2ea', fontFamily: "'AnimeAce', sans-serif", fontSize: 'clamp(12px, 1.8vw, 18px)' }}>
          pull the cord, hunter…
        </div>
      </>)}
    </div>
  )
}

// ── the starter ──────────────────────────────────────────────────

function Starter({ onPull, pulls }: { onPull: () => void; pulls: number }) {
  const [y, setY] = useState(0)
  const drag = useRef<number | null>(null)
  const anim = useRef<number | null>(null)
  const BASE = 150

  const release = (pulled: boolean) => {
    const from = y
    const t0 = performance.now()
    const back = () => {
      const k = Math.min(1, (performance.now() - t0) / 260)
      setY(from * (1 - k) * (1 - k))
      if (k < 1) anim.current = requestAnimationFrame(back)
    }
    back()
    if (pulled) onPull()
  }
  useEffect(() => () => { if (anim.current) cancelAnimationFrame(anim.current) }, [])

  // keyboard: Enter / Space does a full pull
  const keyPull = () => {
    setY(PULL_DISTANCE + 20)
    setTimeout(() => { drag.current = null; setY(0); onPull() }, 140)
  }

  const hint = pulls === 0 ? 'drag the handle down and let go'
    : pulls === 1 ? 'it sputters… again!'
    : 'almost! one more pull'

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center' }}>
      {/* engine */}
      <svg viewBox="0 0 200 110" aria-hidden style={{ position: 'absolute', top: '9%', width: '210px' }}>
        <g fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="40" y="30" width="120" height="70" rx="12" />
          <path d="M60 30V14h80v16" />
          <circle cx="100" cy="65" r="14" />
          <path d="M160 52h30a8 8 0 0 1 0 16h-30" />
          <path d="M162 52l3-5 3 5 3-5 3 5 3-5 3 5 3-5 3 5 3-5 3 5" />
        </g>
      </svg>

      {/* cord + handle */}
      <div style={{ position: 'absolute', top: 'calc(9% + 112px)', width: '120px', height: `${BASE + y + 40}px` }}>
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <line x1="60" y1="0" x2="60" y2={BASE + y} stroke={INK} strokeWidth="3" strokeDasharray="6 5" />
        </svg>
        <button
          aria-label={`Pull the starter cord (${pulls} of ${PULLS_TO_START})`}
          onPointerDown={(e) => { drag.current = e.clientY - y; (e.target as HTMLElement).setPointerCapture(e.pointerId) }}
          onPointerMove={(e) => { if (drag.current !== null) setY(Math.max(0, Math.min(160, e.clientY - drag.current))) }}
          onPointerUp={() => { if (drag.current === null) return; drag.current = null; release(y > PULL_DISTANCE) }}
          onPointerCancel={() => { drag.current = null; release(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); keyPull() } }}
          style={{
            position: 'absolute', left: 0, top: `${BASE + y}px`, width: '120px', height: '40px',
            border: `4px solid ${INK}`, borderRadius: '999px', background: BG, color: INK,
            fontFamily: 'BlambotClassic, sans-serif', fontSize: '20px', letterSpacing: '3px',
            cursor: drag.current !== null ? 'grabbing' : 'grab', touchAction: 'none',
          }}
        >
          PULL
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: '7%', left: 0, right: 0, textAlign: 'center', color: INK, opacity: 0.75, fontFamily: "'AnimeAce', sans-serif", fontSize: '13px', letterSpacing: '1px' }}>
        {hint}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
          {Array.from({ length: PULLS_TO_START }, (_, i) => (
            <span key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', border: `2px solid ${INK}`, background: i < pulls ? INK : 'transparent' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── screen ───────────────────────────────────────────────────────

export default function IntroScreen({ soundOn, onRoar, onDone }: IntroScreenProps) {
  const reduced = prefersReducedMotion()
  const firstVisit = (() => { try { return localStorage.getItem(SEEN_KEY) !== '1' } catch { return false } })()
  const [stage, setStage] = useState<'panels' | 'cord' | 'roar'>(firstVisit && !reduced ? 'panels' : 'cord')
  const [pulls, setPulls] = useState(0)
  const [sfx, setSfx] = useState<{ key: number; text: string; size: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const sputter = useSputter(soundOn)
  const doneRef = useRef(false)

  const toCord = useCallback(() => setStage(s => (s === 'panels' ? 'cord' : s)), [])

  const roar = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
    setStage('roar')
    onRoar()
    setSfx({ key: Date.now(), text: 'BRRRRRM!!', size: 88 })
    if (!reduced) shake(rootRef.current, 10, 45, 12)
    setTimeout(onDone, reduced ? 200 : 650)
  }, [onRoar, onDone, reduced])

  const pullsRef = useRef(0)
  const pull = useCallback(() => {
    const n = ++pullsRef.current
    setPulls(n)
    if (n >= PULLS_TO_START) { roar(); return }
    sputter(n === 1 ? 2 : 4)
    setSfx({ key: Date.now(), text: n === 1 ? 'PUT…' : 'PUT-PUT-PUT', size: n === 1 ? 46 : 52 })
    if (!reduced) shake(rootRef.current, 3 + n * 2, 60, 5)
  }, [roar, sputter, reduced])

  // Enter anywhere = pull (panels: skip to the cord)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      if (stage === 'panels') toCord()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage, toCord])

  return (
    <div
      ref={rootRef}
      style={{
        height: '100dvh', background: BG, position: 'relative', overflow: 'clip', color: INK,
        '--accent': INK, '--on-accent': '#111', '--paper': BG, '--ink': INK,
      } as CSSProperties}
    >
      {stage === 'panels' && <Panels onNext={toCord} />}
      {stage !== 'panels' && <Starter onPull={pull} pulls={pulls} />}
      {stage === 'roar' && !reduced && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0.4] }} transition={{ duration: 0.6 }} style={SPEED_LINES} />}
      {sfx && <Sfx key={sfx.key} text={sfx.text} size={sfx.size} side={stage !== 'roar'} />}

      {/* skip: from the panels to the cord, from the cord straight to the roar */}
      {stage !== 'roar' && (
        <button
          onClick={() => (stage === 'panels' ? toCord() : roar())}
          style={{
            position: 'absolute', right: '16px', top: '14px', zIndex: 20,
            background: 'transparent', color: INK, border: `2px solid ${INK}`, borderRadius: '999px',
            padding: '4px 14px', fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '2px', cursor: 'pointer',
          }}
        >
          {stage === 'panels' ? 'SKIP ›' : 'JUST START ›'}
        </button>
      )}
    </div>
  )
}

// ── the cut, played over the login page ──────────────────────────

export function SlashOverlay({ onEnd }: { onEnd: () => void }) {
  // one fixed timer: the parent re-renders while you type, that must not restart the cut
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  useEffect(() => { const t = setTimeout(() => endRef.current(), 900); return () => clearTimeout(t) }, [])
  if (prefersReducedMotion()) return null
  const half = (clip: string, to: string) => (
    <motion.div
      initial={{ x: 0, y: 0, rotate: 0 }}
      animate={{ x: to.split(' ')[0], y: to.split(' ')[1], rotate: Number(to.split(' ')[2]) }}
      transition={{ delay: 0.24, duration: 0.55, ease: [0.6, 0, 0.8, 0.4] }}
      style={{ position: 'fixed', inset: 0, background: BG, clipPath: clip, zIndex: 9000 }}
    />
  )
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none' }}>
      {half('polygon(0 0, 100% 0, 0 100%)', '-60% -60% -6')}
      {half('polygon(100% 0, 100% 100%, 0 100%)', '60% 60% 6')}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9001 }}>
        <motion.line
          x1="100" y1="0" x2="0" y2="100" stroke={INK} strokeWidth="0.8" strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 1 }}
          animate={{ pathLength: 1, opacity: [1, 1, 0] }}
          transition={{ duration: 0.5, times: [0, 0.5, 1] }}
          style={{ strokeWidth: 6 }}
        />
      </svg>
      {/* the blade itself rips through along the cut */}
      <motion.img
        src="/hand.png" alt=""
        initial={{ left: '-30%', top: '100%', opacity: 0 }}
        animate={{ left: '100%', top: '-40%', opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.6, ease: 'easeIn' }}
        style={{ position: 'fixed', width: '300px', rotate: '-35deg', zIndex: 9002, filter: 'grayscale(1)' }}
      />
    </div>
  )
}
