import type { CSSProperties } from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StickerBomb from './StickerBomb'
import { API_URL } from '../config'

// describe the structure of an avatar object
export interface AvatarItem {
  id: string
  name: string
  src: string
}

const AVATARS: AvatarItem[] = [
  { id: 'denji',    name: 'Denji',       src: '/avatars/avatar_denji.png'    },
  { id: 'power',    name: 'Power',       src: '/avatars/avatar_power.png'    },
  { id: 'makima',   name: 'Makima',      src: '/avatars/avatar_makima2.png'  },
  { id: 'aki',      name: 'Aki',         src: '/avatars/avatar_aki2.png'     },
  { id: 'reze',     name: 'Reze',        src: '/avatars/avatar_reze2.png'    },
  { id: 'himeno',   name: 'Himeno',      src: '/avatars/avatar_himeno.png'   },
  { id: 'kishibe',  name: 'Kishibe',     src: '/avatars/avatar_kishibe.png'  },
  { id: 'kobeni',   name: 'Kobeni',      src: '/avatars/avatar_kobeni.png'   },
  { id: 'asa',      name: 'Asa Mitaka',  src: '/avatars/avatar_asa.png'      },
  { id: 'quanxi',   name: 'Quanxi',      src: '/avatars/avatar_quanxi.png'   },
  { id: 'nayuta',   name: 'Nayuta',      src: '/avatars/avatar_nayuta.png'   },
  { id: 'yoru',     name: 'Yoru',        src: '/avatars/avatar_yoru.png'     },
  { id: 'cosmo',    name: 'Cosmo',       src: '/avatars/avatar_cosmo.png'    },
  { id: 'beam',     name: 'Beam',        src: '/avatars/avatar_beam.png'     },
  { id: 'yoshida',  name: 'Yoshida',     src: '/avatars/avatar_yoshida.png'  },
  { id: 'tenshi',   name: 'Tenshi',      src: '/avatars/avatar_tenshi.png'   },
  { id: 'pingtsi',  name: 'Pingtsi',     src: '/avatars/avatar_pingtsi.png'  },
  { id: 'sawatari', name: 'Sawatari',    src: '/avatars/avatar_sawatari.png' },
  { id: 'kiga',     name: 'Kiga',        src: '/avatars/avatar_kiga.png'     },
  { id: 'tendou',   name: 'Tendou',      src: '/avatars/avatar_tendou.png'   },
  { id: 'pochita',  name: 'Pochita',     src: '/pochita.png'                 },
]

export { AVATARS }

// describe the structure of props for the UsernameScreen component
interface UsernameScreenProps {
  avatar: AvatarItem
  onAvatarChange: (avatar: AvatarItem) => void
  usernameInput: string
  onUsernameInputChange: (value: string) => void
  onSubmit: () => void
  onAccountSubmit: (mode: 'login' | 'register', password: string) => void
  authError: string
  authLoading: boolean
  onClearError: () => void
}

const SLANT = 'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)'

export default function UsernameScreen({ 
  avatar, 
  onAvatarChange, 
  usernameInput, 
  onUsernameInputChange, 
  onSubmit,
  onAccountSubmit,
  authError,
  authLoading,
  onClearError,
}: UsernameScreenProps) {
  const [mode, setMode] = useState<'guest' | 'account'>('guest')
  const [password, setPassword] = useState<string>('')

  const nameOk = usernameInput.trim().length >= 2
  const passOk = password.length >= 6
  const canSubmitAccount = nameOk && passOk && !authLoading

  const switchMode = (m: 'guest' | 'account') => { setMode(m); onClearError() }

  return (
    <div style={{ position:'relative', height:'100vh', overflow:'clip', background:'#0d0d0d', '--accent': '#f2efe6', '--on-accent': '#111', '--paper': '#0e0e0e', '--ink': '#f2efe6' } as CSSProperties}>
    {/* login screen gets the full stickerbomb; stickers can be poked */}
    <StickerBomb density="full" dark mode="everywhere" seed="login" interactive />
    <motion.div className="login-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ position:'relative', zIndex:1, height:'100vh', boxSizing:'border-box', background:'radial-gradient(ellipse at center, rgba(13,13,13,0.9) 0%, rgba(13,13,13,0.6) 40%, transparent 75%)', display:'flex', alignItems:'center', justifyContent:'safe center', flexDirection:'column', gap:'24px', fontFamily:'BlambotClassic, sans-serif', overflowY:'auto', padding:'20px', pointerEvents:'none' }}>

      <h1 style={{ fontSize:'36px', color:'#fff', letterSpacing:'4px', textShadow:'4px 4px 0 var(--accent)', margin:0 }}>
        CHAINSAW <span style={{ color:'var(--accent)' }}>CHAT</span>
      </h1>

      <div style={{ display:'flex', flexDirection:'column', gap:'12px', width:'300px' }}>
        <motion.a
          href={`${API_URL}/auth/github`}
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
          href={`${API_URL}/auth/google`}
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
        <span style={{ fontFamily:"'AnimeAce', sans-serif", fontSize:'10px', color:'#444', letterSpacing:'2px' }}>OR</span>
        <div style={{ flex:1, height:'1px', background:'#222' }} />
      </div>

      <div style={{ position:'relative' }}>
        <img src={avatar.src} style={{ width:'100px', height:'100px', objectFit:'cover', borderRadius:'50%', border:'3px solid var(--accent)', boxShadow:'0 0 20px rgba(17,17,17,0.5)' }} />
        <div style={{ position:'absolute', bottom:'-4px', right:'-4px', background:'var(--accent)', borderRadius:'50%', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>✓</div>
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
                border: avatar.id === av.id ? '3px solid var(--accent)' : '2px solid #333',
                filter: avatar.id === av.id ? 'none' : 'grayscale(60%) brightness(0.7)',
                transition:'all 0.2s',
              }}
            />
            {avatar.id === av.id && (
              <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid var(--accent)', boxShadow:'0 0 8px rgba(17,17,17,0.6)' }} />
            )}
          </motion.div>
        ))}
      </div>

      {/* GUEST / ACCOUNT switch */}
      <div style={{ display:'flex', gap:'6px', width:'280px' }}>
        {(['guest', 'account'] as const).map(m => (
          <motion.button
            key={m}
            whileTap={{ scale:0.95 }} whileHover={{ skewX:-5 }}
            onClick={() => switchMode(m)}
            style={{
              flex:1, padding:'8px', cursor:'pointer',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#111' : '#555',
              border: `2px solid ${mode === m ? '#fff' : '#333'}`,
              fontFamily:"'AnimeAce', sans-serif", fontSize:'10px', letterSpacing:'2px',
              clipPath: SLANT, transition:'all 0.2s',
            }}
          >
            {m === 'guest' ? 'GUEST' : 'ACCOUNT'}
          </motion.button>
        ))}
      </div>

      <p style={{ color:'#555', fontSize:'11px', letterSpacing:'3px', margin:0 }}>
        {mode === 'guest' ? "WHAT'S YOUR NICKNAME?" : 'NICKNAME + PASSWORD'}
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:'10px', width:'280px' }}>
        <input
          style={{ padding:'12px 20px', background:'#1a1a1a', border:'3px solid #fff', color:'#fff', fontSize:'16px', outline:'none', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'2px', textTransform:'uppercase', clipPath:SLANT, textAlign:'center' }}
          placeholder="NICKNAME..."
          maxLength={14}
          value={usernameInput}
          onChange={e => { onUsernameInputChange(e.target.value); onClearError() }}
          onKeyDown={e => e.key === 'Enter' && mode === 'guest' && onSubmit()}
          autoComplete="username"
          autoFocus
        />

        <AnimatePresence mode="wait">
          {mode === 'guest' ? (
            <motion.button
              key="guest"
              initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              whileTap={{ scale:0.95 }} whileHover={{ skewX:-5 }}
              onClick={onSubmit}
              style={{ padding:'12px', background: nameOk ? 'var(--accent)' : '#333', color:'var(--on-accent)', border:'none', fontFamily:'BlambotClassic, sans-serif', fontSize:'16px', letterSpacing:'3px', cursor: nameOk ? 'pointer' : 'default', clipPath:SLANT, transition:'background 0.2s' }}
            >
              ENTER ⛓
            </motion.button>
          ) : (
            <motion.div
              key="account"
              initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              style={{ display:'flex', flexDirection:'column', gap:'10px' }}
            >
              <input
                type="password"
                style={{ padding:'12px 20px', background:'#1a1a1a', border:'3px solid #fff', color:'#fff', fontSize:'16px', outline:'none', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'4px', clipPath:SLANT, textAlign:'center' }}
                placeholder="PASSWORD..."
                maxLength={72}
                value={password}
                onChange={e => { setPassword(e.target.value); onClearError() }}
                onKeyDown={e => e.key === 'Enter' && canSubmitAccount && onAccountSubmit('login', password)}
                autoComplete="current-password"
              />
              <div style={{ display:'flex', gap:'8px' }}>
                {(['login', 'register'] as const).map(m => (
                  <motion.button
                    key={m}
                    whileTap={{ scale:0.95 }} whileHover={canSubmitAccount ? { skewX:-5 } : {}}
                    disabled={!canSubmitAccount}
                    onClick={() => onAccountSubmit(m, password)}
                    style={{
                      flex:1, padding:'12px 6px',
                      background: !canSubmitAccount ? '#333' : m === 'login' ? 'var(--accent)' : 'transparent',
                      color: !canSubmitAccount ? '#777' : m === 'login' ? 'var(--on-accent)' : '#f2efe6',
                      border: m === 'register' && canSubmitAccount ? '3px solid #f2efe6' : 'none', fontFamily:'BlambotClassic, sans-serif', fontSize:'14px', letterSpacing:'2px',
                      cursor: canSubmitAccount ? 'pointer' : 'default', clipPath:SLANT, transition:'background 0.2s',
                    }}
                  >
                    {authLoading ? '...' : m === 'login' ? 'LOG IN ⛓' : 'SIGN UP ✚'}
                  </motion.button>
                ))}
              </div>
              <span style={{ fontFamily:"'AnimeAce', sans-serif", fontSize:'9px', color:'#444', letterSpacing:'1px', textAlign:'center' }}>
                SIGN UP SAVES YOUR CHARACTER &amp; ROOMS · PASSWORD 6+ CHARS
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity:0, scale:0.8, rotate:-3 }} animate={{ opacity:1, scale:1, rotate:-1 }} exit={{ opacity:0 }}
              style={{
                padding:'8px 12px', background:'var(--accent)', color:'var(--on-accent)',
                border:'3px solid #fff', boxShadow:'4px 4px 0 #fff',
                fontFamily:"'AnimeAce', sans-serif", fontSize:'10px', letterSpacing:'1px', textAlign:'center',
              }}
            >
              <span style={{ fontFamily:"'CCDoohickey', BlambotClassic, sans-serif", fontStyle:'italic', fontWeight:900, marginRight:'6px' }}>GRAAA!</span>
              {authError.toUpperCase()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
    </div>
  )
}
