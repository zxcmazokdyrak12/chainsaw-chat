import { useEffect, useRef, useState } from 'react'

// "Berserk / Saw mode": messages that keep coming with less than CHAIN_GAP between them build a combo.
// From ×4 a tachometer revs up in the corner, and the engine revs louder at every tier.
export const CHAIN_GAP = 2000   // ms between two messages that still counts as "a burst"
export const START = 4          // combo at which berserk kicks in
export const TIERS = [
  { at: 4, name: 'REV' },
  { at: 8, name: 'BERSERK' },
  { at: 12, name: 'DEVIL MODE' },
] as const

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

export function useBerserk(opts: { enabled: boolean; sound: boolean }) {
  const [combo, setCombo] = useState(0)
  const [cooling, setCooling] = useState(false)  // the counter falls back after the burst
  const last = useRef(0)
  const comboRef = useRef(0)
  const decay = useRef<ReturnType<typeof setTimeout> | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts

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

    // a new tier: the engine revs, higher each time
    if (c >= START && tierOf(c) > prevTier && optsRef.current.sound) rev(tierOf(c))

    if (decay.current) clearTimeout(decay.current)
    decay.current = setTimeout(() => {
      if (comboRef.current >= START) setCooling(true)
      comboRef.current = 0
      decay.current = setTimeout(() => { setCombo(0); setCooling(false) }, 900)
    }, CHAIN_GAP + 300)
  }

  const reset = () => { comboRef.current = 0; last.current = 0; setCombo(0); setCooling(false) }

  return { combo, active: combo >= START, tier: tierOf(combo), cooling, hit, reset }
}
