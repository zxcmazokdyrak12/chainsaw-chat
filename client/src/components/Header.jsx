import { motion } from 'framer-motion'

export default function Header({ T, theme, username, rooms, currentRoom, activeTab, onTabChange, onThemeToggle }) {
  return (
    <div style={{ background: T.headerBg, borderBottom:`4px solid ${T.headerBorder}`, boxShadow: T.shadow, position:'relative', zIndex:10, transition:'background 0.4s' }}>
      <div style={{ padding:'8px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`2px solid ${T.headerBorder}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <h1 style={{ margin:0, fontSize:'22px', letterSpacing:'3px', color: T.titleColor, textShadow: theme==='light' ? '3px 3px 0 #cc2200' : '3px 3px 0 #444' }}>
            CHAINSAW <span style={{ color: T.titleAccent }}>CHAT</span>
          </h1>
          <span style={{ fontSize:'13px', color: theme==='light' ? '#cc2200' : '#fff', fontFamily:"'AnimeAce', sans-serif", letterSpacing:'1px' }}>
            {rooms.find(r => r.id === currentRoom)?.name || ''}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{ fontSize:'11px', color: T.nameColor, letterSpacing:'2px', fontFamily:"'AnimeAce', sans-serif" }}>{username}</span>
          <motion.button whileTap={{ scale:0.9 }} onClick={onThemeToggle} style={{ background: theme==='light' ? '#111' : '#fff', color: theme==='light' ? '#fff' : '#111', border:`2px solid ${T.headerBorder}`, padding:'4px 10px', fontSize:'12px', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'1px', cursor:'pointer', clipPath:'polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)' }}>
            {theme==='light' ? '◑ DARK' : '◐ LIGHT'}
          </motion.button>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-around', background: T.headerBg, padding:'0 8px 8px' }}>
        {[
          { id:'chat',     icon:'/icon_chat.png',     label:'CHATS',    img:'/denji.png'  },
          { id:'rooms',    icon:'/icon_rooms.png',    label:'ROOMS',    img:'/aki.png'    },
          { id:'settings', icon:'/icon_settings.png', label:'SETTINGS', img:'/makima.png' },
          { id:'profile',  icon:'/icon_profile.png',  label:'PROFILE',  img:'/reze.png'   },
        ].map(tab => (
          <motion.button key={tab.id} onClick={() => onTabChange(tab.id)} whileTap={{ y:-12, transition:{ type:'spring', stiffness:500, damping:12 } }} whileHover={{ y:-4 }} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', padding:'4px 12px 0', minWidth:'72px', position:'relative', borderBottom: activeTab===tab.id ? `4px solid ${theme==='light' ? '#cc2200' : '#fff'}` : '4px solid transparent' }}>
            <div style={{ position:'relative', marginTop:'8px' }}>
              <motion.img src={tab.img} animate={activeTab===tab.id ? { y:0, opacity:1, scale:1 } : { y:14, opacity:0.25, scale:0.7 }} transition={{ type:'spring', stiffness:300, damping:20 }} style={{ position:'absolute', top:'-42px', left:'50%', transform:'translateX(-50%)', height:'52px', objectFit:'contain', pointerEvents:'none', zIndex:3, filter: activeTab===tab.id ? 'none' : 'grayscale(80%)', transition:'filter 0.2s' }} />
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', background: activeTab===tab.id ? (theme==='light' ? '#111' : '#fff') : (theme==='light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'), display:'flex', alignItems:'center', justifyContent:'center', border: activeTab===tab.id ? `3px solid ${theme==='light' ? '#cc2200' : '#fff'}` : `2px solid ${theme==='light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}`, transition:'all 0.2s', position:'relative', zIndex:2, overflow:'hidden' }}>
                <img src={tab.icon} style={{ width:'28px', height:'28px', objectFit:'contain', filter: activeTab===tab.id ? (theme==='light' ? 'invert(1)' : 'invert(0)') : (theme==='light' ? 'invert(0)' : 'invert(1)'), transition:'filter 0.2s' }} />
              </div>
            </div>
            <span style={{ fontSize:'9px', fontFamily:"'AnimeAce', sans-serif", letterSpacing:'1px', marginTop:'5px', color: activeTab===tab.id ? (theme==='light' ? '#cc2200' : '#fff') : (theme==='light' ? '#999' : '#555'), transition:'color 0.2s' }}>
              {tab.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
