import { useEffect, useRef, useState } from 'react'
import { isShout } from '../lib/sound'

// "Peaceful life": somebody in the room says дом / семья / ужин and, for everyone in it, the saw goes quiet —
// warm evening light, photos of the three of them on the fridge. It lasts until someone SHOUTS:
// the photos peel off, the light goes out and the chainsaw is back.
const WORDS = new Set([
  'дом', 'дома', 'домой', 'семья', 'семьёй', 'семьей', 'ужин',
  'home', 'family', 'dinner',
])
// Japanese has no spaces between words, so these are looked up as substrings
const JA = ['ただいま', '家族', '晩ご飯', '晩ごはん', '夕飯']

export function isPeaceWord(text: string): boolean {
  const lower = (text || '').toLowerCase()
  if (JA.some(w => lower.includes(w))) return true
  return lower.split(/[^\p{L}]+/u).some(w => WORDS.has(w))
}

// Optional quiet background: drop a file at client/public/peace/ambient.mp3 and it loops softly.
// No file — no sound (the error is swallowed), nothing else changes.
const AMBIENT_SRC = '/peace/ambient.mp3'
const AMBIENT_VOLUME = 0.18

function fade(audio: HTMLAudioElement, to: number, ms: number, done?: () => void) {
  const from = audio.volume
  const start = performance.now()
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / ms)
    audio.volume = from + (to - from) * k
    if (k < 1) requestAnimationFrame(step)
    else done?.()
  }
  requestAnimationFrame(step)
}

export function usePeace(opts: { enabled: boolean; sound: boolean }) {
  const [active, setActive] = useState(false)
  const activeRef = useRef(false)
  const optsRef = useRef(opts)
  optsRef.current = opts
  const audio = useRef<HTMLAudioElement | null>(null)

  const stopAmbient = (ms = 500) => {
    const a = audio.current
    audio.current = null
    if (!a) return
    fade(a, 0, ms, () => a.pause())
  }

  const startAmbient = () => {
    if (!optsRef.current.sound || audio.current) return
    const a = new Audio(AMBIENT_SRC)
    a.loop = true
    a.volume = 0
    a.addEventListener('error', () => { if (audio.current === a) audio.current = null })
    audio.current = a
    a.play().then(() => fade(a, AMBIENT_VOLUME, 2500)).catch(() => { if (audio.current === a) audio.current = null })
  }

  const set = (on: boolean) => { activeRef.current = on; setActive(on) }

  // feed every message that lands in the room. Returns 'start' | 'break' | null so the caller can add the roar.
  const feel = (text: string | undefined): 'start' | 'break' | null => {
    if (!optsRef.current.enabled) return null
    if (!activeRef.current) {
      if (!isPeaceWord(text ?? '')) return null
      set(true)
      startAmbient()
      return 'start'
    }
    if (isShout(text ?? '')) { shatter(); return 'break' }
    return null
  }

  // the saw comes back (a shout, /roar…)
  const shatter = () => {
    if (!activeRef.current) return
    set(false)
    stopAmbient(250)
  }

  // leaving the room / switching it off: just quietly gone
  const reset = () => { set(false); stopAmbient(400) }

  useEffect(() => { if (!opts.enabled) reset() }, [opts.enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!opts.sound) stopAmbient(300); else if (activeRef.current) startAmbient() }, [opts.sound]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { audio.current?.pause() }, [])

  return { active, activeRef, feel, shatter, reset }
}
