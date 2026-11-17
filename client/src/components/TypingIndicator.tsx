import { motion, AnimatePresence } from 'framer-motion'

interface TypingIndicatorProps {
  typingUsers: string[]
  theme: 'light' | 'dark' | string
}

// "X is typing" as a manga thought balloon: two little bubbles rising into a cloud
export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const who = typingUsers.length > 2
    ? `${typingUsers.slice(0, 2).join(', ')} +${typingUsers.length - 2}`
    : typingUsers.join(' & ')

  return (
    <AnimatePresence>
      {typingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', padding: '4px 0 4px 6px' }}
        >
          {[8, 13].map((size, i) => (
            <motion.div
              key={size}
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              style={{
                width: size, height: size, borderRadius: '50%',
                border: '2.5px solid var(--ink)', backgroundColor: 'var(--paper)',
              }}
            />
          ))}
          <div style={{
            border: '3px solid var(--ink)', borderRadius: '40px',
            backgroundColor: 'var(--paper)', color: 'var(--ink)',
            padding: '8px 18px', fontSize: '11px',
            fontFamily: "'AnimeAce', sans-serif", letterSpacing: '1px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span>{who} {typingUsers.length === 1 ? 'is' : 'are'} typing</span>
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
              >.</motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
