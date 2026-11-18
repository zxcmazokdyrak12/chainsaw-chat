import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { WakeState } from '../hooks/useServerWake'
import { useT } from '../lib/i18n'

const EXPECTED = 50 // seconds a Render cold start usually takes

// a small gauge in the corner: the server's engine warming up
export default function ServerWake({ state, seconds }: { state: WakeState; seconds: number }) {
  const t = useT()
  // "ready" stays for a moment so you see the engine caught, then the pill goes away
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (state !== 'ready') return
    const t = setTimeout(() => setDone(true), 2500)
    return () => clearTimeout(t)
  }, [state])
  const show = !done && (state === 'waking' || state === 'down' || (state === 'ready' && seconds >= 3))
  const pct = state === 'ready' ? 100 : Math.min(95, (seconds / EXPECTED) * 100)
  const text = state === 'waking'
    ? t('SERVER ENGINE IS COLD — WARMING UP {s}s', { s: seconds })
    : state === 'down' ? t("THE SERVER WON'T START — TRY AGAIN LATER") : t('SERVER READY')
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status" aria-live="polite"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
          transition={state === 'ready' ? { delay: 0 } : undefined}
          style={{
            position: 'fixed', left: 12, bottom: 12, zIndex: 9200, width: 'min(320px, calc(100vw - 24px))',
            background: '#f2efe6', color: '#111', border: '3px solid #111', boxShadow: '4px 4px 0 #111',
            padding: '8px 10px', fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', letterSpacing: '1px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <span>{text}</span>
            {state === 'waking' && <span aria-hidden>⚙</span>}
          </div>
          <div aria-hidden style={{ marginTop: '6px', height: '8px', border: '2px solid #111', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', inset: 0, width: `${pct}%`, transition: 'width 1s linear',
              background: state === 'down' ? '#b3140c' : 'repeating-linear-gradient(-45deg, #111 0 4px, transparent 4px 8px)',
            }} />
          </div>
          {state === 'waking' && seconds > 8 && (
            <div style={{ marginTop: '4px', opacity: 0.65, fontSize: '9px' }}>{t("free hosting naps when nobody's around — usually under a minute")}</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
