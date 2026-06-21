import { motion } from 'framer-motion'

const SFX_WORDS = ['VROOM!', 'SLASH!', 'BANG!', 'GRAAA!', 'DOOOM!', 'GRIND!']

export default function MessageBubble({ msg, index, isOwn, theme, T, onContextMenu }) {
  const isShout = msg.content === msg.content.toUpperCase()
    && msg.content.replace(/[^a-zA-Zа-яА-Я]/g, '').length > 2

  return (
    <motion.div initial={{ x: isOwn ? 50 : -50, opacity:0 }} animate={{ x:0, opacity:1 }} whileHover={{ scale:1.02 }} transition={{ type:'spring', stiffness:320, damping:28 }} style={{ display:'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', transform:`rotate(${msg.rotate || 0}deg)` }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap:'3px' }}>
        <span style={{ fontFamily:"'CCDoohickey', BlambotClassic, sans-serif", fontSize:'13px', fontWeight:900, fontStyle:'italic', color: T.sfxColor, letterSpacing:'1px', paddingLeft: isOwn ? 0 : '14px', paddingRight: isOwn ? '14px' : 0 }}>
          {SFX_WORDS[index % SFX_WORDS.length]}
        </span>
        <span style={{ fontSize:'10px', letterSpacing:'2px', color: isOwn ? (theme==='light' ? '#666' : '#555') : T.nameColor, paddingLeft: isOwn ? 0 : '4px', paddingRight: isOwn ? '4px' : 0, fontFamily:"'AnimeAce', sans-serif", display:'flex', alignItems:'center', gap:'6px', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
          {msg.avatar && (
            <img src={msg.avatar} style={{ width:'22px', height:'22px', borderRadius:'50%', objectFit:'cover', border:`1px solid ${theme==='light' ? '#111' : '#fff'}` }} />
          )}
          {msg.username} · {msg.time}
        </span>
        <div style={{ position:'relative' }}>
          <div
            style={{ position:'relative', cursor: 'context-menu' }}
            onContextMenu={(e) => {
              e.preventDefault();
              onContextMenu({ x: e.clientX, y: e.clientY, msg });
            }}
          />
          <div style={{ position:'absolute', bottom:'20px', ...(isOwn ? { right:'-18px', borderTop:'10px solid transparent', borderBottom:'10px solid transparent', borderLeft:`18px solid ${theme==='dark' ? '#fff' : '#111'}` } : { left:'-18px', borderTop:'10px solid transparent', borderBottom:'10px solid transparent', borderRight:`18px solid ${theme==='dark' ? '#fff' : '#111'}` }), zIndex:2 }} />
          <div style={{ position:'absolute', bottom:'22px', ...(isOwn ? { right:'-13px', borderTop:'8px solid transparent', borderBottom:'8px solid transparent', borderLeft:`14px solid ${theme==='dark' ? '#222' : '#fff'}` } : { left:'-13px', borderTop:'8px solid transparent', borderBottom:'8px solid transparent', borderRight:`14px solid ${theme==='dark' ? '#222' : '#fff'}` }), zIndex:3 }} />
          <div style={{ position:'relative', maxWidth:'240px', padding:'14px 18px 18px 18px', borderRadius: isOwn ? '50% 50% 20% 50% / 50% 50% 50% 20%' : '50% 50% 50% 20% / 50% 50% 20% 50%', background: theme==='dark' ? '#222' : '#fff', border:`3px solid ${theme==='dark' ? '#fff' : '#111'}`, boxShadow: isOwn ? (theme==='dark' ? '3px 3px 0 #fff' : '3px 3px 0 #111') : (theme==='dark' ? '-3px 3px 0 #fff' : '-3px 3px 0 #111'), color: theme==='dark' ? '#fff' : '#111', fontSize: isShout ? '17px' : '14px', fontWeight: isShout ? 900 : 'normal', fontFamily: isShout ? "'DeathRattle', sans-serif" : "'BlambotClassic', sans-serif", letterSpacing: isShout ? '2px' : 'normal', lineHeight:'1.5', wordBreak:'break-word', overflowWrap:'break-word', transition:'background 0.3s' }}>

            {msg.type === 'audio' && msg.audioData ? (
              <audio
                controls
                src={msg.audioData}
                style={{ width:'100%', maxWidth:'220px', filter: theme==='dark' ? 'invert(1)' : 'none', outline: 'none' }}
              />
            ) : (
              msg.content
            )}

            <span style={{ display:'block', textAlign:'right', fontSize:'10px', marginTop:'6px', color: theme==='dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontFamily:"'AnimeAce', sans-serif" }}>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
