import { useEffect, useRef, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import CompanionArt, { type CompanionKind } from './art'
import { useT } from '../../lib/i18n'

// A blank chapter: three devil silhouettes drift with the mouse (parallax), plus an invitation to write.
const LAYERS: { kind: CompanionKind; depth: number; style: CSSProperties; size: number; rot: number }[] = [
  { kind: 'static', depth: 8, size: 150, rot: 8, style: { right: '8%', top: '12%' } },
  { kind: 'inkling', depth: 16, size: 210, rot: -6, style: { left: '5%', bottom: '4%' } },
  { kind: 'seal', depth: 26, size: 120, rot: 12, style: { right: '24%', bottom: '2%' } },
]

export default function EmptyRoom({ dark }: { dark: boolean }) {
  const t = useT()
  const reduce = useReducedMotion()
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (reduce) return
    let raf = 0
    let px = 0, py = 0
    const paint = () => {
      raf = 0
      refs.current.forEach((el, i) => {
        if (!el) return
        const d = LAYERS[i]!.depth
        el.style.transform = `translate3d(${(-px * d).toFixed(1)}px, ${(-py * d).toFixed(1)}px, 0)`
      })
    }
    const move = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth) * 2 - 1
      py = (e.clientY / window.innerHeight) * 2 - 1
      if (!raf) raf = requestAnimationFrame(paint)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => { window.removeEventListener('pointermove', move); if (raf) cancelAnimationFrame(raf) }
  }, [reduce])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {LAYERS.map((l, i) => (
        <div key={l.kind} ref={el => { refs.current[i] = el }}
          style={{ position: 'absolute', ...l.style, transition: 'transform 0.25s ease-out', willChange: 'transform' }}>
          <CompanionArt kind={l.kind} mood="idle" size={l.size} still
            style={{ transform: `rotate(${l.rot}deg)`, opacity: 0.09, filter: dark ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
        </div>
      ))}
      <div style={{
        position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%) rotate(-1.5deg)',
        textAlign: 'center', color: 'var(--ink)', width: 'min(80%, 340px)',
      }}>
        <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '26px', letterSpacing: '4px', lineHeight: 1.1 }}>
          {t('THE PAGE IS BLANK')}
        </div>
        <div style={{ height: '3px', background: 'var(--ink)', margin: '8px auto', width: '60%' }} />
        <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '11px', opacity: 0.75, lineHeight: 1.6 }}>
          {t('draw the first panel — say something')}
        </div>
      </div>
    </motion.div>
  )
}
