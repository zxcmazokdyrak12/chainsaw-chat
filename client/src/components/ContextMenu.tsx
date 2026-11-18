import { useEffect, useRef, type KeyboardEvent, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { REACTIONS } from '../config'

// Define the shape of the message object expected by the context menu
interface MessageData {
  id: number
  username: string | null
  content: string | null
  [key: string]: any // Absorbs any extra properties from the backend
}

// Define the state structure for context menu positioning and payload
interface ContextMenuState {
  x: number
  y: number
  msg: MessageData
}

// Define props for the ContextMenu component
interface ContextMenuProps {
  contextMenu: ContextMenuState | null
  theme: string
  username: string | null
  onDelete: (id: number) => void
  onCopy: (content: string) => void
  onReact: (id: number, emoji: string) => void
  onReply?: (msg: MessageData) => void
  onEdit?: (msg: MessageData) => void
  onClose: () => void
}

export default function ContextMenu({ 
  contextMenu, 
  theme, 
  username, 
  onDelete, 
  onCopy, 
  onReact,
  onReply,
  onEdit,
  onClose 
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const ink = theme === 'dark' ? '#fff' : '#111'

  // keyboard: focus the first item, arrows move, Esc closes and gives focus back
  useEffect(() => {
    if (!contextMenu) return
    const back = document.activeElement as HTMLElement | null
    // preventScroll: focusing must never scroll the feed (the feed closes the menu when it scrolls)
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus({ preventScroll: true }))
    return () => { back?.focus?.({ preventScroll: true }) }
  }, [contextMenu])

  const onKeyDown = (e: KeyboardEvent) => {
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const i = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); onClose(); return }
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (step) { e.preventDefault(); items[(i + step + items.length) % items.length]?.focus() }
  }

  // keep the whole menu on screen (it is 282px wide, ~190px tall)
  const left = contextMenu ? Math.max(8, Math.min(contextMenu.x, window.innerWidth - 282 - 12)) : 0
  const top = contextMenu ? Math.max(8, Math.min(contextMenu.y, window.innerHeight - 200)) : 0

  const item: CSSProperties = {
    display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', cursor: 'pointer',
    background: 'transparent', border: 'none', color: ink, fontFamily: 'inherit', fontSize: 'inherit',
  }

  // rendered on <body>: inside the feed it was clipped by overflow:hidden and offset by transformed parents
  return createPortal(
    <AnimatePresence>
      {contextMenu && (
        <motion.div
          ref={ref}
          role="menu"
          aria-label="Message actions"
          onKeyDown={onKeyDown}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            position: 'fixed',
            top,
            left,
            background: theme === 'dark' ? '#222' : '#fff',
            border: `3px solid ${ink}`,
            padding: '4px',
            zIndex: 9999,
            borderRadius: '8px',
            boxShadow: `4px 4px 0 ${ink}`,
            fontFamily: "'AnimeAce', sans-serif",
            fontSize: '12px',
            width: '282px',
            boxSizing: 'border-box',
            cursor: 'default'
          }}
          onClick={onClose}
          onMouseLeave={onClose}
        >
          {/* quick reactions */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '4px 4px 6px',
            borderBottom: `2px solid ${ink}`,
            marginBottom: '2px',
          }}>
            {REACTIONS.map(r => (
              <motion.button
                key={r.id}
                role="menuitem"
                aria-label={`React: ${r.label}`}
                title={r.label}
                whileHover={{ scale: 1.5, rotate: -8, zIndex: 2 }}
                whileTap={{ scale: 0.8 }}
                onClick={(e) => { e.stopPropagation(); onReact(contextMenu.msg.id, r.id) }}
                style={{
                  cursor: 'pointer', width: '34px', height: '34px', borderRadius: '50%', padding: 0, overflow: 'hidden',
                  border: `2px solid ${ink}`, position: 'relative', background: '#fff',
                }}
              >
                <img src={r.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </motion.button>
            ))}
          </div>

          {onReply && typeof contextMenu.msg.id === 'number' && (
            <button role="menuitem" onClick={() => onReply(contextMenu.msg)} style={{ ...item, fontWeight: 900 }}>
              REPLY ↩
            </button>
          )}

          {onEdit && contextMenu.msg.username === username && typeof contextMenu.msg.id === 'number' && (!contextMenu.msg.type || contextMenu.msg.type === 'text') && (
            <button role="menuitem" onClick={() => onEdit(contextMenu.msg)} style={{ ...item, fontWeight: 900 }}>
              EDIT ✎
            </button>
          )}

          {/* Only show DELETE if the message owner matches the current logged-in user */}
          {contextMenu.msg.username === username && (
            <button role="menuitem" onClick={() => onDelete(contextMenu.msg.id)} style={{ ...item, color: '#ff4a4a', fontWeight: 900 }}>
              DELETE 🗑️
            </button>
          )}

          <button role="menuitem" onClick={() => onCopy(contextMenu.msg.content || '')} style={item}>
            COPY 📋
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
