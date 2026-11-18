import { useCallback, useEffect, useRef, useState } from 'react'
import { socket } from '../lib/socket'
import { isShout } from '../lib/sound'
import type { Mood } from '../components/companions/art'

const SLEEP_AFTER = 25_000 // quiet this long → it dozes off
const FAST_KEYS = 9        // this many keystrokes …
const FAST_WINDOW = 1500   // … within this many ms → battle stance
const HOT_FOR = 1200

// What the companion by the input bar is doing right now.
// panic (socket lost) > listen (recording) > hype (CAPS / fast typing / poke) > sleep > idle
export function useCompanion({ input, isRecording, activity, enabled }: {
  input: string; isRecording: boolean; activity: number; enabled: boolean
}) {
  const [lost, setLost] = useState(false)
  const [hot, setHot] = useState(false)
  const [asleep, setAsleep] = useState(false)
  const keys = useRef<number[]>([])
  const prevLen = useRef(input.length)
  const hotTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const wake = useCallback(() => {
    setAsleep(false)
    if (sleepTimer.current) clearTimeout(sleepTimer.current)
    sleepTimer.current = setTimeout(() => setAsleep(true), SLEEP_AFTER)
  }, [])

  const heat = useCallback((ms = HOT_FOR) => {
    setHot(true)
    if (hotTimer.current) clearTimeout(hotTimer.current)
    hotTimer.current = setTimeout(() => setHot(false), ms)
  }, [])

  // the line dropped → panic, with the same 1.5 s grace as the banner
  useEffect(() => {
    if (!enabled) return
    let t: ReturnType<typeof setTimeout> | null = null
    const down = () => { if (t) clearTimeout(t); t = setTimeout(() => setLost(true), 1500) }
    const up = () => { if (t) clearTimeout(t); setLost(false) }
    socket.on('disconnect', down)
    socket.on('connect', up)
    return () => { socket.off('disconnect', down); socket.off('connect', up); if (t) clearTimeout(t) }
  }, [enabled])

  // typing: count keystrokes in a sliding window
  useEffect(() => {
    if (!enabled) return
    const grew = input.length > prevLen.current
    prevLen.current = input.length
    if (!grew) return
    wake()
    const now = Date.now()
    keys.current = [...keys.current.filter(k => now - k < FAST_WINDOW), now]
    if (keys.current.length >= FAST_KEYS) heat()
  }, [input, enabled, wake, heat])

  // any chat traffic or recording wakes it up
  useEffect(() => { if (enabled) wake() }, [activity, isRecording, enabled, wake])

  useEffect(() => () => {
    if (hotTimer.current) clearTimeout(hotTimer.current)
    if (sleepTimer.current) clearTimeout(sleepTimer.current)
  }, [])

  const shouting = input.trim().length > 0 && isShout(input.trim())
  const mood: Mood = lost ? 'panic' : isRecording ? 'listen' : (hot || shouting) ? 'hype' : asleep ? 'sleep' : 'idle'

  const poke = useCallback(() => { wake(); heat(900) }, [wake, heat])
  return { mood, poke }
}

// "ням" / "nom" / "chomp" / "いただきます" → the companion leans in and eats the system captions
const NOM = /(^|[^\p{L}])(ням|ням-ням|ом-ном|омном|съешь|сожри|nom|nomnom|om nom|chomp|gulp)([^\p{L}]|$)/iu
export const isNom = (text: string | null | undefined): boolean => {
  const s = (text ?? '').trim()
  return s.length > 0 && s.length < 200 && (NOM.test(s) || s.includes('いただきます'))
}
