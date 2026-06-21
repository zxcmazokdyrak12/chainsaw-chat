import { motion, AnimatePresence } from 'framer-motion'

export default function ContextMenu({ contextMenu, theme, username, onDelete, onCopy, onClose }) {
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
            width: '140px',
            cursor: 'default'
          }}
          onClick={onClose}
          onMouseLeave={onClose}
        >
          {contextMenu.msg.username === username && (
            <div
              onClick={() => onDelete(contextMenu.msg.id)}
              style={{ padding: '8px 12px', cursor: 'pointer', color: '#ff4a4a', fontWeight: 900 }}
            >
              УДАЛИТЬ 🗑️
            </div>
          )}

          <div
            onClick={() => onCopy(contextMenu.msg.content)}
            style={{ padding: '8px 12px', cursor: 'pointer', color: theme === 'dark' ? '#fff' : '#111' }}
          >
            КОПИРОВАТЬ 📋
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
