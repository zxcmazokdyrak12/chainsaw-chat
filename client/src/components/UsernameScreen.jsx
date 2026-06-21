import { motion } from 'framer-motion'

const AVATARS = [
  { id: 'denji',    name: 'Denji',         src: '/avatars/avatar_denji.png'    },
  { id: 'power',    name: 'Power',         src: '/avatars/avatar_power.png'    },
  { id: 'makima',   name: 'Makima',        src: '/avatars/avatar_makima2.png'  },
  { id: 'aki',      name: 'Aki',           src: '/avatars/avatar_aki2.png'     },
  { id: 'reze',     name: 'Reze',          src: '/avatars/avatar_reze2.png'    },
  { id: 'himeno',   name: 'Himeno',        src: '/avatars/avatar_himeno.png'   },
  { id: 'kishibe',  name: 'Kishibe',       src: '/avatars/avatar_kishibe.png'  },
  { id: 'kobeni',   name: 'Kobeni',        src: '/avatars/avatar_kobeni.png'   },
  { id: 'asa',      name: 'Asa Mitaka',    src: '/avatars/avatar_asa.png'      },
  { id: 'quanxi',   name: 'Quanxi',        src: '/avatars/avatar_quanxi.png'   },
  { id: 'nayuta',   name: 'Nayuta',        src: '/avatars/avatar_nayuta.png'   },
  { id: 'yoru',     name: 'Yoru',          src: '/avatars/avatar_yoru.png'     },
  { id: 'cosmo',    name: 'Cosmo',         src: '/avatars/avatar_cosmo.png'    },
  { id: 'beam',     name: 'Beam',          src: '/avatars/avatar_beam.png'     },
  { id: 'yoshida',  name: 'Yoshida',       src: '/avatars/avatar_yoshida.png'  },
  { id: 'tenshi',   name: 'Tenshi',        src: '/avatars/avatar_tenshi.png'   },
  { id: 'pingtsi',  name: 'Pingtsi',       src: '/avatars/avatar_pingtsi.png'  },
  { id: 'sawatari', name: 'Sawatari',      src: '/avatars/avatar_sawatari.png' },
  { id: 'kiga',     name: 'Kiga',          src: '/avatars/avatar_kiga.png'     },
  { id: 'tendou',   name: 'Tendou',        src: '/avatars/avatar_tendou.png'   },
  { id: 'pochita',  name: 'Pochita',       src: '/pochita.png'                 },
]

export { AVATARS }

export default function UsernameScreen({ avatar, onAvatarChange, usernameInput, onUsernameInputChange, onSubmit }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ height:'100vh', background:'#0d0d0d', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'24px', fontFamily:'BlambotClassic, sans-serif', overflowY:'auto', padding:'20px' }}>

      <h1 style={{ fontSize:'36px', color:'#fff', letterSpacing:'4px', textShadow:'4px 4px 0 #cc2200', margin:0 }}>
        CHAINSAW <span style={{ color:'#cc2200' }}>CHAT</span>
      </h1>

      <div style={{ display:'flex', flexDirection:'column', gap:'12px', width:'300px' }}>
        <motion.a
          href="https://chainsaw-chat.onrender.com/auth/github"
          whileHover={{ skewX:-5, scale:1.03 }}
          whileTap={{ scale:0.97 }}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:'12px',
            padding:'14px', background:'#24292e', color:'#fff',
            textDecoration:'none', fontSize:'14px', letterSpacing:'2px',
            clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)',
            border:'2px solid #444',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          LOG IN WITH GITHUB
        </motion.a>

        <motion.a
          href="https://chainsaw-chat.onrender.com/auth/google"
          whileHover={{ skewX:-5, scale:1.03 }}
          whileTap={{ scale:0.97 }}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:'12px',
            padding:'14px', background:'#fff', color:'#333',
            textDecoration:'none', fontSize:'14px', letterSpacing:'2px',
            clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)',
            border:'2px solid #ddd',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          LOG IN WITH GOOGLE
        </motion.a>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'12px', width:'300px' }}>
        <div style={{ flex:1, height:'1px', background:'#222' }} />
        <span style={{ fontFamily:"'AnimeAce', sans-serif", fontSize:'10px', color:'#444', letterSpacing:'2px' }}>ИЛИ</span>
        <div style={{ flex:1, height:'1px', background:'#222' }} />
      </div>

      <div style={{ position:'relative' }}>
        <img src={avatar.src} style={{ width:'100px', height:'100px', objectFit:'cover', borderRadius:'50%', border:'3px solid #cc2200', boxShadow:'0 0 20px rgba(204,34,0,0.5)' }} />
        <div style={{ position:'absolute', bottom:'-4px', right:'-4px', background:'#cc2200', borderRadius:'50%', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>✓</div>
      </div>

      <p style={{ color:'#555', fontSize:'11px', letterSpacing:'3px', margin:0 }}>CHOOSE YOUR CHARACTER</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'8px', maxWidth:'420px' }}>
        {AVATARS.map(av => (
          <motion.div
            key={av.id}
            whileHover={{ scale:1.1 }}
            whileTap={{ scale:0.95 }}
            onClick={() => onAvatarChange(av)}
            style={{ cursor:'pointer', position:'relative' }}
            title={av.name}
          >
            <img
              src={av.src}
              style={{
                width:'52px', height:'52px',
                objectFit:'cover', borderRadius:'50%',
                border: avatar.id === av.id ? '3px solid #cc2200' : '2px solid #333',
                filter: avatar.id === av.id ? 'none' : 'grayscale(60%) brightness(0.7)',
                transition:'all 0.2s',
              }}
            />
            {avatar.id === av.id && (
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid #cc2200', boxShadow:'0 0 8px rgba(204,34,0,0.6)' }} />
            )}
          </motion.div>
        ))}
      </div>

      <p style={{ color:'#555', fontSize:'11px', letterSpacing:'3px', margin:0 }}>WHAT'S YOUR NICKNAME?</p>

      <div style={{ display:'flex', flexDirection:'column', gap:'10px', width:'280px' }}>
        <input
          style={{ padding:'12px 20px', background:'#1a1a1a', border:'3px solid #fff', color:'#fff', fontSize:'16px', outline:'none', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'2px', textTransform:'uppercase', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)', textAlign:'center' }}
          placeholder="NICKNAME..."
          maxLength={14}
          value={usernameInput}
          onChange={e => onUsernameInputChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          autoFocus
        />
        <motion.button
          whileTap={{ scale:0.95 }} whileHover={{ skewX:-5 }}
          onClick={onSubmit}
          style={{ padding:'12px', background: usernameInput.trim().length >= 2 ? '#cc2200' : '#333', color:'#fff', border:'none', fontFamily:'BlambotClassic, sans-serif', fontSize:'16px', letterSpacing:'3px', cursor: usernameInput.trim().length >= 2 ? 'pointer' : 'default', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)', transition:'background 0.2s' }}
        >
          ENTER ⛓
        </motion.button>
      </div>
    </motion.div>
  )
}
