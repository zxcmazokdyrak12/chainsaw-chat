import { useEffect, useState } from 'react'
import { API_URL } from '../config'

export type WakeState = 'checking' | 'waking' | 'ready' | 'down'

// Render's free server naps after ~15 min idle and needs up to a minute to boot.
// Ping it the moment the page opens — the intro hides most of the wait.
export function useServerWake() {
  const [state, setState] = useState<WakeState>('checking')
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let alive = true
    const t0 = Date.now()
    const tick = setInterval(() => alive && setSeconds(Math.round((Date.now() - t0) / 1000)), 1000)
    // after 2 s without an answer it's a cold start, not a slow network
    const cold = setTimeout(() => alive && setState(s => (s === 'checking' ? 'waking' : s)), 2000)

    const ping = async (): Promise<void> => {
      if (!alive) return
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 8000)
        const r = await fetch(`${API_URL}/ping`, { signal: ctrl.signal, cache: 'no-store' })
        clearTimeout(t)
        if (r.ok) { if (alive) setState('ready'); clearInterval(tick); return }
      } catch { /* still asleep */ }
      if (Date.now() - t0 > 120_000) { if (alive) setState('down'); clearInterval(tick); return }
      setTimeout(ping, 3000)
    }
    ping()
    return () => { alive = false; clearInterval(tick); clearTimeout(cold) }
  }, [])

  return { state, seconds }
}
