import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { socket } from '../lib/socket'

// lost the socket for more than a moment → say so instead of silently dropping messages
export default function ConnectionBanner() {
  const [lost, setLost] = useState(false)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null
    const down = () => { if (t) clearTimeout(t); t = setTimeout(() => setLost(true), 1500) }
    const up = () => { if (t) clearTimeout(t); setLost(false) }
    socket.on('disconnect', down)
    socket.on('connect', up)
    return () => { socket.off('disconnect', down); socket.off('connect', up); if (t) clearTimeout(t) }
  }, [])
  return (
    <AnimatePresence>
      {lost && (
        <motion.div
          role="alert"
          initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, textAlign: 'center',
            background: 'var(--ink)', color: 'var(--paper)', padding: '5px 10px',
            fontFamily: "'AnimeAce', sans-serif", fontSize: '11px', letterSpacing: '1px',
          }}
        >
          ⚠ CONNECTION LOST — RECONNECTING… (messages will wait)
        </motion.div>
      )}
    </AnimatePresence>
  )
}
