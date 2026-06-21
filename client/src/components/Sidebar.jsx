import { motion } from 'framer-motion'

export default function Sidebar({ rooms, currentRoom, theme, T, onJoinRoom }) {
  return (
    <div style={{ width:'155px', background: T.sidebarBg, borderRight:`3px solid ${T.sidebarBorder}`, display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
      <div style={{ padding:'8px 12px', fontSize:'10px', letterSpacing:'2px', color: theme==='light' ? '#999' : '#555', borderBottom:`2px solid ${T.sidebarBorder}`, fontFamily:'BlambotClassic, sans-serif' }}>
        ROOMS
      </div>
      {rooms.map(room => (
        <motion.button key={room.id} whileTap={{ scale:0.97 }} onClick={() => onJoinRoom(room.id)} style={{ background: currentRoom===room.id ? (theme==='light' ? '#111' : '#fff') : 'transparent', color: currentRoom===room.id ? (theme==='light' ? '#fff' : '#111') : T.titleColor, border:'none', cursor:'pointer', padding:'10px 12px', textAlign:'left', fontFamily:'BlambotClassic, sans-serif', fontSize:'13px', letterSpacing:'1px', borderBottom:`1px solid ${theme==='light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, transition:'all 0.15s' }}>
          {room.name}
          <span style={{ display:'block', fontSize:'9px', opacity:0.5, fontFamily:"'AnimeAce', sans-serif", marginTop:'2px' }}>
            {room.count} сообщ.
          </span>
        </motion.button>
      ))}
    </div>
  )
}
