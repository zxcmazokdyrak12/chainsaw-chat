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
  onClose: () => void
}

export default function ContextMenu({ 
  contextMenu, 
  theme, 
  username, 
  onDelete, 
  onCopy, 
  onReact,
  onClose 
}: ContextMenuProps) {
  return (
    <AnimatePresence>
      {contextMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: theme === 'dark' ? '#222' : '#fff',
            border: `3px solid ${theme === 'dark' ? '#fff' : '#111'}`,
            padding: '4px',
            zIndex: 9999,
            borderRadius: '8px',
            boxShadow: theme === 'dark' ? '4px 4px 0 #fff' : '4px 4px 0 #111',
            fontFamily: "'AnimeAce', sans-serif",
            fontSize: '12px',
            width: '282px',
            cursor: 'default'
          }}
          onClick={onClose}
          onMouseLeave={onClose}
        >
          {/* quick reactions */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '4px 4px 6px',
            borderBottom: `2px solid ${theme === 'dark' ? '#fff' : '#111'}`,
            marginBottom: '2px',
          }}>
            {REACTIONS.map(r => (
              <motion.img
                key={r.id}
                src={r.src}
                alt={r.label}
                title={r.label}
                whileHover={{ scale: 1.5, rotate: -8, zIndex: 2 }}
                whileTap={{ scale: 0.8 }}
                onClick={(e) => { e.stopPropagation(); onReact(contextMenu.msg.id, r.id) }}
                style={{
                  cursor: 'pointer', width: '34px', height: '34px', borderRadius: '50%',
                  objectFit: 'cover', border: `2px solid ${theme === 'dark' ? '#fff' : '#111'}`,
                  position: 'relative', background: '#fff',
                }}
              />
            ))}
          </div>

          {/* Only show DELETE if the message owner matches the current logged-in user */}
          {contextMenu.msg.username === username && (
            <div
              onClick={() => onDelete(contextMenu.msg.id)}
              style={{ padding: '8px 12px', cursor: 'pointer', color: '#ff4a4a', fontWeight: 900 }}
            >
              DELETE 🗑️
            </div>
          )}

          <div
            onClick={() => onCopy(contextMenu.msg.content || '')}
            style={{ padding: '8px 12px', cursor: 'pointer', color: theme === 'dark' ? '#fff' : '#111' }}
          >
            COPY 📋
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}