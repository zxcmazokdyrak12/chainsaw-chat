import { useEffect } from 'react'
import { motion } from 'framer-motion'

// a picture from the chat, full screen. Click / Esc closes.
export default function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <motion.div
      role="dialog" aria-label="Picture"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500, cursor: 'zoom-out',
        background: 'rgba(10,10,10,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
    >
      <motion.img
        src={src} alt=""
        initial={{ scale: 0.9, rotate: -2 }} animate={{ scale: 1, rotate: 0 }}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', border: '5px solid #f2efe6', boxShadow: '8px 8px 0 #000', background: '#fff' }}
      />
    </motion.div>
  )
}
