import { useEffect, useRef, useState } from 'react'

// "Berserk / Saw mode": messages that keep coming with less than CHAIN_GAP between them build a combo.
// From ×4 the edges of the feed get ink splatters and chain scratches and a tachometer revs up.
export const CHAIN_GAP = 2000   // ms between two messages that still counts as "a burst"
export const START = 4          // combo at which berserk kicks in
export const TIERS = [
  { at: 4, name: 'REV' },
  { at: 8, name: 'BERSERK' },
  { at: 12, name: 'DEVIL MODE' },
] as const

export interface Splat { id: number; seed: number; kind: 'ink' | 'chain'; side: 'top' | 'right' | 'bottom' | 'left'; pos: number; size: number; rot: number }

export const tierOf = (combo: number) => TIERS.reduce((t, x, i) => (combo >= x.at ? i + 1 : t), 0)

// a two-stroke revving up: sawtooth through a low-pass, pitch climbing with the tier
function rev(tier: number) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = (rev as unknown as { ctx?: AudioContext }).ctx ?? ((rev as unknown as { ctx?: AudioContext }).ctx = new AC())
    const t = ctx.currentTime
    const o = ctx.createOscillator(); o.type = 'sawtooth'
    const base = 45 + tier * 22
    o.frequency.setValueAtTime(base, t)
    o.frequency.exponentialRampToValueAtTime(base * 2.6, t + 0.28)
    o.frequency.exponentialRampToValueAtTime(base * 1.7, t + 0.5)
    // the "put-put" of the engine: amplitude chopped at a fast rate
    const chop = ctx.createOscillator(); chop.frequency.value = 28 + tier * 6
    const chopGain = ctx.createGain(); chopGain.gain.value = 0.5
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900 + tier * 300
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
    chop.connect(chopGain).connect(g.gain)
    o.connect(lp).connect(g).connect(ctx.destination)
    o.start(t); chop.start(t); o.stop(t + 0.6); chop.stop(t + 0.6)
  } catch { /* no audio */ }
}

export function useBerserk(opts: { enabled: boolean; sound: boolean; onTierUp?: (tier: number) => void }) {
  const [combo, setCombo] = useState(0)
  const [splats, setSplats] = useState<Splat[]>([])
  const [cooling, setCooling] = useState(false)  // the counter falls back after the burst
  const last = useRef(0)
  const comboRef = useRef(0)
  const decay = useRef<ReturnType<typeof setTimeout> | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts
  const nextId = useRef(1)

  useEffect(() => () => { if (decay.current) clearTimeout(decay.current) }, [])

  // call for every message that lands in the room (anyone's)
  const hit = () => {
    if (!optsRef.current.enabled) return
    const now = Date.now()
    const chained = now - last.current < CHAIN_GAP
    last.current = now
    const prevTier = tierOf(comboRef.current)
    comboRef.current = chained ? comboRef.current + 1 : 1
    const c = comboRef.current
    setCombo(c)
    setCooling(false)

    if (c >= START) {
      const tier = tierOf(c)
      // one mark per message, two at the top tier; never more than 8 on screen
      const count = tier >= 3 ? 2 : 1
      const fresh: Splat[] = Array.from({ length: count }, () => {
        const id = nextId.current++
        const sides = ['top', 'right', 'bottom', 'left'] as const
        return {
          id, seed: Math.floor(Math.random() * 1e9),
          kind: Math.random() < 0.38 ? 'chain' : 'ink',
          side: sides[Math.floor(Math.random() * 4)]!,
          pos: 6 + Math.random() * 88,
          size: 90 + Math.random() * 90 + tier * 25,
          rot: Math.random() * 360,
        }
      })
      setSplats(s => [...s, ...fresh].slice(-8))
      fresh.forEach(f => setTimeout(() => setSplats(s => s.filter(x => x.id !== f.id)), 1500))
      if (tier > prevTier) {
        if (optsRef.current.sound) rev(tier)
        optsRef.current.onTierUp?.(tier)
      }
    }

    if (decay.current) clearTimeout(decay.current)
    decay.current = setTimeout(() => {
      if (comboRef.current >= START) setCooling(true)
      comboRef.current = 0
      decay.current = setTimeout(() => { setCombo(0); setCooling(false) }, 900)
    }, CHAIN_GAP + 300)
  }

  const reset = () => { comboRef.current = 0; last.current = 0; setCombo(0); setSplats([]); setCooling(false) }

  return { combo, active: combo >= START, tier: tierOf(combo), splats, cooling, hit, reset }
}
