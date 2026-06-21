import { motion, AnimatePresence } from 'framer-motion'

export default function RoomsTab({ rooms, currentRoom, theme, T, onJoinRoom, onSwitchToChat, showCreateRoom, setShowCreateRoom, showJoinByCode, setShowJoinByCode, newRoomName, setNewRoomName, joinCode, setJoinCode, joinError, setJoinError, createdCode, setCreatedCode, onCreateRoom, onJoinByCode }) {
  return (
    <div style={{ flex:1, padding:'20px', overflowY:'auto' }}>

      {createdCode && (
        <motion.div
          initial={{ opacity:0, y:-10 }}
          animate={{ opacity:1, y:0 }}
          style={{ background: theme==='light' ? '#111' : '#fff', color: theme==='light' ? '#fff' : '#111', padding:'16px 20px', marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', border:`3px solid ${theme==='light' ? '#cc2200' : '#cc2200'}` }}
        >
          <div>
            <div style={{ fontSize:'11px', opacity:0.6, fontFamily:"'AnimeAce', sans-serif", marginBottom:'4px' }}>YOUR ROOM CODE - SHARE!</div>
            <div style={{ fontSize:'28px', letterSpacing:'6px', fontFamily:'Impact, sans-serif' }}>{createdCode}</div>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(createdCode); }}
            style={{ background:'#cc2200', color:'#fff', border:'none', padding:'8px 16px', fontFamily:'Impact, sans-serif', fontSize:'13px', cursor:'pointer', letterSpacing:'1px' }}
          >
            COPY
          </button>
          <button onClick={() => setCreatedCode('')} style={{ background:'transparent', border:'none', color:'inherit', cursor:'pointer', fontSize:'18px', opacity:0.5 }}>✕</button>
        </motion.div>
      )}

      <div style={{ display:'flex', gap:'12px', marginBottom:'24px' }}>
        <motion.button
          whileHover={{ skewX:-3 }} whileTap={{ scale:0.97 }}
          onClick={() => { setShowCreateRoom(!showCreateRoom); setShowJoinByCode(false) }}
          style={{ flex:1, padding:'14px', background: theme==='light' ? '#111' : '#fff', color: theme==='light' ? '#fff' : '#111', border:`3px solid ${T.headerBorder}`, fontFamily:'Impact, sans-serif', fontSize:'15px', letterSpacing:'2px', cursor:'pointer', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)' }}
        >
          + CREATE
        </motion.button>
        <motion.button
          whileHover={{ skewX:-3 }} whileTap={{ scale:0.97 }}
          onClick={() => { setShowJoinByCode(!showJoinByCode); setShowCreateRoom(false) }}
          style={{ flex:1, padding:'14px', background:'transparent', color: T.titleColor, border:`3px solid ${T.headerBorder}`, fontFamily:'Impact, sans-serif', fontSize:'15px', letterSpacing:'2px', cursor:'pointer', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)' }}
        >
          # LOG IN WITH CODE
        </motion.button>
      </div>

      <AnimatePresence>
        {showCreateRoom && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ marginBottom:'20px', overflow:'hidden' }}>
            <div style={{ display:'flex', gap:'10px' }}>
              <input
                style={{ flex:1, padding:'10px 14px', background: T.inputBg, border:`3px solid ${T.inputBorder}`, color: T.inputColor, fontSize:'14px', outline:'none', fontFamily:'Impact, sans-serif', letterSpacing:'1px', textTransform:'uppercase' }}
                placeholder="ROOM NAME (OPTIONAL)..."
                maxLength={16}
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onCreateRoom()}
              />
              <motion.button whileTap={{ scale:0.95 }} onClick={onCreateRoom} style={{ padding:'10px 20px', background:'#cc2200', color:'#fff', border:'none', fontFamily:'Impact, sans-serif', fontSize:'14px', letterSpacing:'2px', cursor:'pointer' }}>
                CREATE ⛓
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJoinByCode && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ marginBottom:'20px', overflow:'hidden' }}>
            <div style={{ display:'flex', gap:'10px', flexDirection:'column' }}>
              <div style={{ display:'flex', gap:'10px' }}>
                <input
                  style={{ flex:1, padding:'10px 14px', background: T.inputBg, border:`3px solid ${joinError ? '#cc2200' : T.inputBorder}`, color: T.inputColor, fontSize:'16px', outline:'none', fontFamily:'Impact, sans-serif', letterSpacing:'4px', textTransform:'uppercase', textAlign:'center' }}
                  placeholder="KAIRYU42"
                  maxLength={8}
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
                  onKeyDown={e => e.key === 'Enter' && onJoinByCode()}
                />
                <motion.button whileTap={{ scale:0.95 }} onClick={onJoinByCode} style={{ padding:'10px 20px', background: theme==='light' ? '#111' : '#fff', color: theme==='light' ? '#fff' : '#111', border:'none', fontFamily:'Impact, sans-serif', fontSize:'14px', letterSpacing:'2px', cursor:'pointer' }}>
                  ENTER
                </motion.button>
              </div>
              {joinError && (
                <span style={{ color:'#cc2200', fontSize:'12px', fontFamily:"'AnimeAce', sans-serif", letterSpacing:'1px' }}>
                  ✕ {joinError}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'12px' }}>
        {rooms.map(room => (
          <motion.button key={room.id} whileHover={{ scale:1.02, skewX:-2 }} whileTap={{ scale:0.97 }} onClick={() => { onJoinRoom(room.id); onSwitchToChat() }} style={{ padding:'16px', background: currentRoom===room.id ? (theme==='light' ? '#111' : '#fff') : 'transparent', color: currentRoom===room.id ? (theme==='light' ? '#fff' : '#111') : T.titleColor, border:`3px solid ${T.headerBorder}`, cursor:'pointer', fontFamily:'Impact, sans-serif', fontSize:'15px', letterSpacing:'1px', textAlign:'left', boxShadow: T.shadow, transition:'all 0.2s', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)' }}>
            <div>{room.name}</div>
            <div style={{ fontSize:'11px', letterSpacing:'3px', opacity:0.5, marginTop:'4px', fontFamily:'Impact, sans-serif' }}>{room.code}</div>
            <div style={{ fontSize:'9px', opacity:0.4, fontFamily:"'AnimeAce', sans-serif", marginTop:'2px' }}>{room.count} сообщ.</div>
            {currentRoom === room.id && <div style={{ fontSize:'10px', color:'#cc2200', marginTop:'4px' }}>● ТЫ ЗДЕСЬ</div>}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
