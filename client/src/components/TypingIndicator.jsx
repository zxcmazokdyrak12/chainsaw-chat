import { motion, AnimatePresence } from 'framer-motion'

export default function TypingIndicator({ typingUsers, theme }) {
  return (
    <AnimatePresence>
      {typingUsers.length > 0 && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0' }}>
          <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
            {[0,1,2].map(i => (
              <motion.div key={i} animate={{ y:[0,-5,0] }} transition={{ repeat:Infinity, duration:0.6, delay:i*0.15 }} style={{ width:'6px', height:'6px', borderRadius:'50%', background: theme==='light' ? '#111' : '#fff' }} />
            ))}
          </div>
          <span style={{ fontSize:'11px', color: theme==='light' ? '#888' : '#666', fontFamily:"'AnimeAce', sans-serif", letterSpacing:'1px' }}>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'typing' : 'typing'}...
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
