import { useCallback, useEffect, useRef, useState } from 'react'
import { startBirds, type Ambience } from '../lib/birds'

// "Peaceful life": somebody in the room says дом / семья / ужин and, for everyone in it,
// the chat goes dark, a beat of silence, then a quiet panel — a table, three mugs, sparrows outside.
// After a few seconds it fades and the chat comes back by itself.
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

// the timeline, ms from the trigger
export const SCENE = {
  dark: 1200,     // the chat fades to black
  panelIn: 2800,  // silence, then the panel starts to appear (and the birds)
  fadeOut: 11000, // the panel and the dark fade away
  end: 12400,     // the chat is back
} as const
const COOLDOWN = 30_000 // the same room can't replay it right away

export function usePeace(opts: { enabled: boolean; sound: boolean }) {
  const [active, setActive] = useState(false)
  const activeRef = useRef(false)
  const optsRef = useRef(opts)
  optsRef.current = opts
  const lastAt = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const birds = useRef<Ambience | null>(null)

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const stopBirds = (ms?: number) => { birds.current?.stop(ms); birds.current = null }

  // stable identity: the scene's timers depend on it
  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = []
    birds.current?.stop(400); birds.current = null
    activeRef.current = false
    setActive(false)
  }, [])

  // feed every text message that lands in the room
  const feel = (text: string | undefined): boolean => {
    if (!optsRef.current.enabled || activeRef.current) return false
    if (Date.now() - lastAt.current < COOLDOWN || !isPeaceWord(text ?? '')) return false
    lastAt.current = Date.now()
    activeRef.current = true
    setActive(true)
    timers.current.push(
      setTimeout(() => { if (optsRef.current.sound) birds.current = startBirds() }, SCENE.panelIn),
      setTimeout(() => stopBirds(1300), SCENE.fadeOut),
      setTimeout(finish, SCENE.end),
    )
    return true
  }

  useEffect(() => { if (!opts.enabled) finish() }, [opts.enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!opts.sound) stopBirds(300) }, [opts.sound])
  useEffect(() => () => { clear(); stopBirds(0) }, [])

  // reset: leaving the room. skip: Esc during the scene.
  return { active, activeRef, feel, reset: finish, skip: finish }
}
