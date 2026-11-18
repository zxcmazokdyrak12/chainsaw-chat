import { useEffect } from 'react'
import { motion } from 'framer-motion'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const ALT = isMac ? '⌥' : 'Alt'
const CTRL = isMac ? '⌘' : 'Ctrl'

export const SHORTCUTS: [string, string][] = [
  [`${ALT} + 1…9`, 'jump to chapter (room) 1–9'],
  [`${ALT} + C / R / S / P`, 'Chat · Rooms · Settings · Profile'],
  [`${CTRL} + K`, 'search this room'],
  [`${ALT} + E`, 'save the chapter as a manga page'],
  ['↑ in an empty line', 'reply to the last message'],
  ['Esc', 'cancel the reply / close a panel'],
  [`${CTRL} + Shift + S`, 'hide the selection as a ||spoiler||'],
  ['Tab to a balloon, then R', 'reply to that balloon'],
  ['Tab to a balloon, then Enter', 'its menu (react, copy, pin, delete)'],
  ['?', 'this page'],
]

// "?" — every shortcut on one page
export default function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === '?') { e.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9600, background: 'rgba(10,10,10,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <motion.div
        role="dialog" aria-modal="true" aria-labelledby="kbd-title"
        initial={{ scale: 0.94, rotate: -1 }} animate={{ scale: 1, rotate: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(460px, 100%)', maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--paper)', color: 'var(--ink)', border: '4px solid var(--ink)', boxShadow: '8px 8px 0 var(--ink)',
          padding: '18px 20px', fontFamily: "'AnimeAce', sans-serif",
        }}
      >
        <h2 id="kbd-title" style={{ margin: '0 0 12px', fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '3px', fontSize: '20px', borderBottom: '3px solid var(--ink)', paddingBottom: '6px' }}>
          KEYS 鍵
        </h2>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px', fontSize: '11px', alignItems: 'baseline' }}>
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt><kbd style={{ fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '1px', border: '2px solid var(--ink)', borderBottomWidth: '4px', borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap' }}>{k}</kbd></dt>
              <dd style={{ margin: 0 }}>{v}</dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </motion.div>
  )
}
