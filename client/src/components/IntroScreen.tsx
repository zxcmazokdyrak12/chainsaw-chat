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
const PLATE = '#1b1b1b'
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

// the rope: a dry rasp while it's pulled out, a whip + clack when it snaps back
export interface RopeSound { rasp: (len: number) => void; snap: () => void; whoosh: () => void }
function useRopeSound(enabled: boolean): RopeSound {
  const ctxRef = useRef<AudioContext | null>(null)
  const noiseRef = useRef<AudioBuffer | null>(null)
  const get = () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = ctxRef.current ?? (ctxRef.current = new AC())
    if (!noiseRef.current) {
      const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const d = b.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      noiseRef.current = b
    }
    return { ctx, noise: noiseRef.current }
  }
  // band-passed noise burst; freq can glide from f0 to f1
  const burst = (dur: number, f0: number, f1: number, vol: number, q = 1.2, delay = 0) => {
    if (!enabled) return
    try {
      const { ctx, noise } = get()
      const t = ctx.currentTime + delay
      const src = ctx.createBufferSource(); src.buffer = noise
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q
      bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 4))
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      src.connect(bp).connect(g).connect(ctx.destination)
      src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02)
    } catch { /* no audio — fine */ }
  }
  const click = (delay: number, vol = 0.4) => {
    if (!enabled) return
    try {
      const { ctx } = get()
      const t = ctx.currentTime + delay
      const o = ctx.createOscillator(); o.type = 'square'
      o.frequency.setValueAtTime(1900, t); o.frequency.exponentialRampToValueAtTime(300, t + 0.03)
      const g = ctx.createGain()
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.06)
    } catch { /* no audio — fine */ }
  }
  return {
    // pitch climbs as more rope comes out
    rasp: (len) => burst(0.07, 900 + len * 9, 1300 + len * 9, 0.12, 2.5),
    snap: () => { burst(0.22, 3200, 700, 0.18, 0.9); click(0.21) },
    whoosh: () => { burst(0.35, 5200, 500, 0.3, 0.7); click(0.17, 0.55); click(0.24, 0.3) },
  }
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

// The starter port: a recoil-start housing with a flanged eyelet the cord comes out of.
function StarterPort({ taut }: { taut: boolean }) {
  return (
    <svg viewBox="0 0 220 120" width="220" height="120" aria-hidden style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <defs>
        <clipPath id="sp-ring"><path d="M110 40a38 38 0 1 0 0.01 0zM110 52a26 26 0 1 1-0.01 0z" fillRule="evenodd" /></clipPath>
      </defs>
      <g stroke={INK} strokeLinecap="round" strokeLinejoin="round">
        {/* housing plate */}
        <path d="M30 8h160a22 22 0 0 1 22 22v62a22 22 0 0 1-22 22H30A22 22 0 0 1 8 92V30A22 22 0 0 1 30 8z" fill={PLATE} strokeWidth="5" />
        <path d="M26 18h168" strokeWidth="1.5" opacity=".45" />
        {/* cooling slots */}
        {[0, 1, 2, 3].map(i => (
          <g key={i}>
            <path d={`M${24 + i * 9} 42l8 38`} strokeWidth="5" />
            <path d={`M${170 + i * 9} 42l8 38`} strokeWidth="5" />
          </g>
        ))}
        {/* corner bolts */}
        {[[24, 24], [196, 24], [24, 98], [196, 98]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="7" fill={BG} strokeWidth="3" />
            <path d={`M${x - 4} ${y + 2}l8 -4`} strokeWidth="2.5" />
          </g>
        ))}
        {/* flange with hatched ring */}
        <circle cx="110" cy="78" r="38" fill={BG} strokeWidth="5" />
        <g clipPath="url(#sp-ring)" strokeWidth="1.6" opacity=".7">
          {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${66 + i * 6} 120l30 -84`} />)}
        </g>
        <circle cx="110" cy="78" r="26" fill={BG} strokeWidth="3.5" />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + 0.5
          return <circle key={i} cx={110 + Math.cos(a) * 32} cy={78 + Math.sin(a) * 32} r="2.6" fill={INK} strokeWidth="0" />
        })}
        {/* eyelet */}
        <circle cx="110" cy="78" r="13" fill="#000" strokeWidth="4" />
        <path d="M101 72a11 11 0 0 1 9-5" strokeWidth="2" opacity=".8" />
        {/* stamped label */}
        <text x="110" y="33" textAnchor="middle" fill={INK} stroke="none"
          style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '11px', letterSpacing: '3px' }}>STARTER</text>
        {/* strain marks when the cord is pulled far */}
        {taut && (
          <g strokeWidth="2.5">
            <path d="M84 122l-9 10" /><path d="M136 122l9 10" /><path d="M66 112l-12 4" /><path d="M154 112l12 4" />
          </g>
        )}
      </g>
    </svg>
  )
}

// The T-grip: dog-bone bar with finger scallops, rubber ribs, a boss where the knotted rope enters.
function StarterGrip() {
  const bar = 'M20 18C50 14 110 14 140 18C157 20 158 51 142 53C127 55 121 46 111 50C101 54 96 47 87 50C82 52 78 52 73 50C64 47 59 54 49 50C39 46 33 55 18 53C2 51 3 20 20 18Z'
  return (
    <svg viewBox="0 0 160 64" width="160" height="64" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      <defs><clipPath id="sg-bar"><path d={bar} /></clipPath></defs>
      <g stroke={INK} strokeLinecap="round" strokeLinejoin="round">
        {/* boss + knot */}
        <path d="M65 19L70 2h20l5 17" fill={PLATE} strokeWidth="4" />
        <path d="M73 9h14" strokeWidth="1.6" opacity=".6" />
        <ellipse cx="80" cy="3" rx="6" ry="4" fill={BG} strokeWidth="3" />
        {/* bar */}
        <path d={bar} fill={PLATE} strokeWidth="4.5" />
        <g clipPath="url(#sg-bar)" strokeWidth="1.5" opacity=".75">
          {Array.from({ length: 30 }, (_, i) => <path key={i} d={`M${i * 6 - 10} 60l14 -22`} />)}
        </g>
        <path d="M24 25C60 21 100 21 136 25" strokeWidth="1.8" opacity=".55" />
        {/* rubber ribs on both ends */}
        {[22, 27, 32, 128, 133, 138].map(x => <path key={x} d={`M${x} 27v15`} strokeWidth="2.6" />)}
        <text x="80" y="38" textAnchor="middle" fill={INK} stroke="none"
          style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '12px', letterSpacing: '3px' }}>PULL</text>
      </g>
    </svg>
  )
}

function Starter({ onPull, pulls, rope, roaring }: { onPull: () => void; pulls: number; rope: RopeSound; roaring: boolean }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const lastRasp = useRef(0)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const anim = useRef<number | null>(null)
  const EYE = 78     // eyelet centre inside the port
  const BASE = 70    // resting rope length below the eyelet
  const { x, y } = pos

  const release = (pulled: boolean) => {
    const from = pos
    const t0 = performance.now()
    const back = () => {
      const k = Math.min(1, (performance.now() - t0) / 260)
      const e = (1 - k) * (1 - k)
      setPos({ x: from.x * e, y: from.y * e })
      if (k < 1) anim.current = requestAnimationFrame(back)
    }
    back()
    lastRasp.current = 0
    const last = pulled && pulls + 1 >= PULLS_TO_START // the roar has its own whoosh
    if (from.y > 25 && !last) rope.snap()
    if (pulled) onPull()
  }
  useEffect(() => () => { if (anim.current) cancelAnimationFrame(anim.current) }, [])

  // 3rd pull: the engine catches and the rope whips back into the port
  const posRef = useRef(pos)
  posRef.current = pos
  useEffect(() => {
    if (!roaring) return
    if (anim.current) cancelAnimationFrame(anim.current)
    drag.current = null
    rope.whoosh()
    if (prefersReducedMotion()) { setPos({ x: 0, y: 0 }); return }
    const from = posRef.current
    const to = -BASE + 6
    const t0 = performance.now()
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 170)
      const e = k * k
      setPos({ x: from.x * (1 - e), y: from.y + (to - from.y) * e })
      if (k < 1) anim.current = requestAnimationFrame(step)
    }
    step()
  }, [roaring]) // eslint-disable-line react-hooks/exhaustive-deps

  // keyboard: Enter / Space does a full pull
  const keyPull = () => {
    setPos({ x: 0, y: PULL_DISTANCE + 20 })
    rope.rasp(PULL_DISTANCE)
    setTimeout(() => { drag.current = null; setPos({ x: 0, y: 0 }); if (pulls + 1 < PULLS_TO_START) rope.snap(); onPull() }, 140)
  }

  const hint = pulls === 0 ? 'drag the handle down and let go'
    : pulls === 1 ? 'it sputters… again!'
    : 'almost! one more pull'

  // rope runs from the eyelet to the grip's knot
  const endX = 110 + x
  const endY = EYE + BASE + y
  const tilt = Math.max(-14, Math.min(14, x / 4))

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: '10%', width: '220px', height: `${EYE + BASE + y + 70}px` }}>
        <StarterPort taut={y > PULL_DISTANCE} />

        {/* braided rope: outline, light core, twist ticks */}
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <g strokeLinecap="round">
            <line x1="110" y1={EYE} x2={endX} y2={endY} stroke={INK} strokeWidth="10" />
            <line x1="110" y1={EYE} x2={endX} y2={endY} stroke={BG} strokeWidth="5" />
            <line x1="110" y1={EYE} x2={endX} y2={endY} stroke={INK} strokeWidth="5" strokeLinecap="butt"
              strokeDasharray="2.5 3.5" strokeDashoffset={-y} />
          </g>
          {roaring && !prefersReducedMotion() && (
            <g stroke={INK} strokeLinecap="round" strokeWidth="2.5" opacity=".85">
              {[-26, -16, 16, 26].map((dx, i) => (
                <line key={dx} x1={110 + dx} y1={EYE + 30 + i * 6} x2={110 + dx} y2={EYE + 120 + i * 10} />
              ))}
            </g>
          )}
        </svg>

        <button
          aria-label={`Pull the starter cord (${pulls} of ${PULLS_TO_START})`}
          onPointerDown={(e) => { drag.current = { x: e.clientX - x, y: e.clientY - y }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }}
          onPointerMove={(e) => {
            if (!drag.current) return
            const ny = Math.max(0, Math.min(170, e.clientY - drag.current.y))
            if (ny - lastRasp.current > 16) { lastRasp.current = ny; rope.rasp(ny) }
            else if (ny < lastRasp.current) lastRasp.current = ny
            setPos({ x: Math.max(-40, Math.min(40, e.clientX - drag.current.x)), y: ny })
          }}
          onPointerUp={() => { if (!drag.current) return; drag.current = null; release(y > PULL_DISTANCE) }}
          onPointerCancel={() => { drag.current = null; release(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); keyPull() } }}
          style={{
            position: 'absolute', left: `${endX - 80}px`, top: `${endY - 2}px`, width: '160px', height: '64px',
            padding: 0, border: 'none', background: 'transparent', borderRadius: '18px',
            transform: `rotate(${tilt}deg) scale(${roaring ? 0.82 : 1})`, transformOrigin: '80px 2px', pointerEvents: roaring ? 'none' : undefined,
            cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none',
          }}
        >
          <StarterGrip />
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: '7%', left: 0, right: 0, textAlign: 'center', color: INK, opacity: roaring ? 0 : 0.75, transition: 'opacity .2s', fontFamily: "'AnimeAce', sans-serif", fontSize: '13px', letterSpacing: '1px' }}>
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
  const rope = useRopeSound(soundOn)
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
      {stage !== 'panels' && <Starter onPull={pull} pulls={pulls} rope={rope} roaring={stage === 'roar'} />}
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
