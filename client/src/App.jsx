import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'

const socket = io('https://chainsaw-chat.onrender.com', {
  transports: ['websocket', 'polling']
})

const CHAINSAW_SFX = '/chainsaw.mp3'
const CHAINSAW_IMG = '/hand.png'
const SFX_WORDS = ['VROOM!', 'SLASH!', 'BANG!', 'GRAAA!', 'DOOOM!', 'GRIND!']
const CUTE_WORDS = ['honey','baby','darling','sweetie','angel','sunshine','bunny','kitty', 'cute', 'love', 'sweet', 'aww', '❤️', '🥺', '💕', '😍', '🐾']
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

const LIGHT = {
  appBg: '#f0ebe0', headerBg: '#e8e3d8', headerBorder: '#111',
  inputZoneBg: '#e8e3d8', inputBorder: '#111', inputBg: '#fff', inputColor: '#111',
  nameColor: '#cc2200', sfxColor: '#cc2200', titleColor: '#111', titleAccent: '#cc2200',
  btnBg: '#111', btnColor: '#fff', shadow: '5px 5px 0 rgba(0,0,0,0.85)',
  halftone: 'rgba(0,0,0,0.07)', sidebarBg: '#e0dbd0', sidebarBorder: '#111',
}
const DARK = {
  appBg: '#111', headerBg: '#0a0a0a', headerBorder: '#fff',
  inputZoneBg: '#0a0a0a', inputBorder: '#fff', inputBg: '#1a1a1a', inputColor: '#fff',
  nameColor: '#fff', sfxColor: '#fff', titleColor: '#fff', titleAccent: '#fff',
  btnBg: '#fff', btnColor: '#111', shadow: '5px 5px 0 rgba(255,255,255,0.15)',
  halftone: 'rgba(255,255,255,0.03)', sidebarBg: '#0a0a0a', sidebarBorder: '#fff',
}

export default function App() {
  const [phase, setPhase]                   = useState('intro')
  const [username, setUsername]             = useState('')
  const [usernameInput, setUsernameInput]   = useState('')
  const [messages, setMessages]             = useState([])
  const [input, setInput]                   = useState('')
  const [theme, setTheme]                   = useState('light')
  const [activeTab, setActiveTab]           = useState('chat')
  const [currentRoom, setCurrentRoom]       = useState('general')
  const [rooms, setRooms]                   = useState([])
  const [typingUsers, setTypingUsers]       = useState([])
  const [pochitaVisible, setPochitaVisible] = useState(false)
  const [hearts, setHearts]                 = useState([])
  const bottomRef  = useRef(null)
  const typingTimer = useRef(null)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinByCode, setShowJoinByCode] = useState(false)
  const [newRoomName, setNewRoomName]       = useState('')
  const [joinCode, setJoinCode]             = useState('')
  const [joinError, setJoinError]           = useState('')
  const [createdCode, setCreatedCode]       = useState('')  // We show the code after creation
  const [isRecording, setIsRecording]       = useState(false)
  const mediaRecorder = useRef(null)
  const audioChunks   = useRef([])
  const [avatar, setAvatar] = useState(AVATARS[0])
  
  
  const T = theme === 'light' ? LIGHT : DARK

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
      window.history.replaceState({}, '', '/')
    }
    const saved = localStorage.getItem('token')
    if (saved) {
      fetch('https://chainsaw-chat.onrender.com/auth/me', {
        headers: { Authorization: `Bearer ${saved}` }
      })
        .then(r => r.json())
        .then(user => {
          if (user.username) {
            setUsername(user.username)
            setAvatar(user.avatar
              ? { id: 'oauth', name: user.username, src: user.avatar }
              : AVATARS[0]
            )
            setPhase('chat')
            setTimeout(() => {
              socket.emit('join_room', { roomId: 'general', username: user.username, avatar: user.avatar })
            }, 100)
          }
        })
        .catch(() => localStorage.removeItem('token'))
    }
  }, [])

  const triggerPochita = (text) => {
    const lower = text.toLowerCase()
    const isCute = CUTE_WORDS.some(w => lower.includes(w))
    if (!isCute || Math.random() > 0.4) return
    const newHearts = Array.from({ length: 9 }, (_, i) => ({
      id: i, x: 10 + Math.random() * 75,
      delay: Math.random() * 0.5, size: 40 + Math.random() * 40,
      rotate: -40 + Math.random() * 80,
    }))
    setPochitaVisible(true)
    setHearts(newHearts)
    setTimeout(() => { setPochitaVisible(false); setHearts([]) }, 2500)
  }

  useEffect(() => {
    socket.on('rooms_list', (list) => setRooms(list))
    socket.on('room_history', (history) => setMessages(history))
    socket.on('receive_message', (msg) => {
      setMessages(p => [...p, msg])
      triggerPochita(msg.content)
    })
    socket.on('room_created', ({ id, code, name }) => {
  setCreatedCode(code)   // show the code to the user
  joinRoom(id)           // let's go straight in
  setShowCreateRoom(false)
  setNewRoomName('')
  })
  socket.on('join_by_code_success', ({ roomId }) => {
  joinRoom(roomId)
  setShowJoinByCode(false)
  setJoinCode('')
  setJoinError('')
  setActiveTab('chat')
  })
  socket.on('join_error', (msg) => {
  setJoinError(msg)
  })
    socket.on('typing_update', (users) => setTypingUsers(users))
    socket.on('user_joined', ({ username: who }) => {
  setMessages(p => [...p, {
    id: Date.now(), system: true,
    content: `${who} joined the room`,
    time: new Date().toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' })
  }])
})
    return () => {
  socket.off('rooms_list')
  socket.off('room_history')
  socket.off('receive_message')
  socket.off('typing_update')
  socket.off('user_joined')
}
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const joinRoom = (roomId) => {
  setCurrentRoom(roomId)
  setMessages([])
  setTypingUsers([])
  socket.emit('join_room', { roomId, username, avatar: avatar.src })
}

  const handleSetUsername = () => {
  if (usernameInput.trim().length < 2) return
  const name = usernameInput.trim().toUpperCase()
  setUsername(name)
  setPhase('chat')
  setTimeout(() => {
    socket.emit('join_room', { roomId: 'general', username: name, avatar: avatar.src })
  }, 100)
}

  const handleStart = () => {
    const audio = new Audio(CHAINSAW_SFX)
    audio.volume = 0.5
    audio.play().catch(() => {})
    setPhase('slashing')
    setTimeout(() => setPhase('username'), 1200)
  }

  const sendMessage = () => {
    if (!input.trim()) return
    const isAllCaps = input.trim() === input.trim().toUpperCase()
      && input.trim().replace(/[^a-zA-Zа-яА-Я]/g, '').length > 2
    if (isAllCaps && Math.random() < 0.1) {
      const audio = new Audio(CHAINSAW_SFX)
      audio.volume = 0.4
      audio.play().catch(() => {})
    }
    socket.emit('send_message', { roomId: currentRoom, username, content: input.trim(), avatar: avatar.src })
    socket.emit('typing_stop', { roomId: currentRoom })
    setInput('')
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    socket.emit('typing_start', { roomId: currentRoom, username })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId: currentRoom })
    }, 1500)
  }
  const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    audioChunks.current = []

    mediaRecorder.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data)
    }

    mediaRecorder.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
      const reader = new FileReader()
      reader.onloadend = () => {
        // send as base64
        socket.emit('send_message', {
          roomId: currentRoom,
          username,
          content: '🎤 audio message',
          type: 'audio',
          audioData: reader.result,
        })
      }
      reader.readAsDataURL(blob)
      stream.getTracks().forEach(t => t.stop())
    }

    mediaRecorder.current.start()
    setIsRecording(true)
  } catch (e) {
    alert('No access to microphone')
  }
}

const stopRecording = () => {
  mediaRecorder.current?.stop()
  setIsRecording(false)
}

const createRoom = () => {
  socket.emit('create_room', { username, roomName: newRoomName })
}

const joinByCode = () => {
  if (joinCode.trim().length < 6) return
  socket.emit('join_by_code', { code: joinCode.trim(), username })
}
  // ─── LOGIN SCREEN ─────────────────────────────────────────
  if (phase === 'intro' || phase === 'slashing') {
    return (
      <div style={{ height:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
        <motion.div style={{ position:'absolute', left:0, right:0, top:0, height:'100%', background:'#111', zIndex:2, clipPath:'polygon(0 0,100% 0,100% 50%,0 50%)' }} animate={phase==='slashing' ? { x:-120, y:-120, opacity:0 } : {}} transition={{ duration:0.7, ease:'easeIn' }} />
        <motion.div style={{ position:'absolute', left:0, right:0, bottom:0, height:'100%', background:'#111', zIndex:2, clipPath:'polygon(0 50%,100% 50%,100% 100%,0 100%)' }} animate={phase==='slashing' ? { x:120, y:120, opacity:0 } : {}} transition={{ duration:0.7, ease:'easeIn' }} />
        {phase === 'slashing' && (
          <motion.div initial={{ scaleX:0, opacity:1 }} animate={{ scaleX:1, opacity:0 }} transition={{ duration:0.5 }} style={{ position:'absolute', top:'50%', left:0, right:0, height:'3px', background:'#cc2200', zIndex:5, transformOrigin:'left', boxShadow:'0 0 12px #cc2200' }} />
        )}
        <motion.img src={CHAINSAW_IMG} alt="chainsaw" initial={{ x:'-60vw', y:'60vh', rotate:-35, opacity:0 }} animate={phase==='slashing' ? { x:'60vw', y:'-60vh', rotate:-35, opacity:[0,1,1,0] } : { opacity:0 }} transition={{ duration:0.7, ease:'easeIn' }} style={{ position:'absolute', width:'340px', objectFit:'contain', zIndex:3, filter:'drop-shadow(0 0 20px rgba(204,34,0,0.7))' }} />
        <AnimatePresence>
          {phase === 'intro' && (
            <motion.button key="btn" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.8 }} whileHover={{ scale:1.08, skewX:-8 }} whileTap={{ scale:0.93 }} onClick={handleStart} style={{ position:'relative', zIndex:4, background:'transparent', color:'#fff', border:'4px solid #fff', padding:'20px 48px', fontSize:'28px', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'4px', cursor:'pointer' }}>
              START ENGINE ⛓
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ─── NICKNAME SCREEN ──────────────────────────────────────
  if (phase === 'username') {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ height:'100vh', background:'#0d0d0d', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'24px', fontFamily:'BlambotClassic, sans-serif', overflowY:'auto', padding:'20px' }}>

      <h1 style={{ fontSize:'36px', color:'#fff', letterSpacing:'4px', textShadow:'4px 4px 0 #cc2200', margin:0 }}>
        CHAINSAW <span style={{ color:'#cc2200' }}>CHAT</span>
      </h1>
      {/* OAuth buttons */}
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

      {/* Separator */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', width:'300px' }}>
        <div style={{ flex:1, height:'1px', background:'#222' }} />
        <span style={{ fontFamily:"'AnimeAce', sans-serif", fontSize:'10px', color:'#444', letterSpacing:'2px' }}>ИЛИ</span>
        <div style={{ flex:1, height:'1px', background:'#222' }} />
      </div>

      {/* Avatar */}
      <div style={{ position:'relative' }}>
        <img src={avatar.src} style={{ width:'100px', height:'100px', objectFit:'cover', borderRadius:'50%', border:'3px solid #cc2200', boxShadow:'0 0 20px rgba(204,34,0,0.5)' }} />
        <div style={{ position:'absolute', bottom:'-4px', right:'-4px', background:'#cc2200', borderRadius:'50%', width:'24px', height:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>✓</div>
      </div>

      <p style={{ color:'#555', fontSize:'11px', letterSpacing:'3px', margin:0 }}>CHOOSE YOUR CHARACTER</p>

      {/* Avatars */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'8px', maxWidth:'420px' }}>
        {AVATARS.map(av => (
          <motion.div
            key={av.id}
            whileHover={{ scale:1.1 }}
            whileTap={{ scale:0.95 }}
            onClick={() => setAvatar(av)}
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

      {/* Nickname input */}
      <div style={{ display:'flex', flexDirection:'column', gap:'10px', width:'280px' }}>
        <input
          style={{ padding:'12px 20px', background:'#1a1a1a', border:'3px solid #fff', color:'#fff', fontSize:'16px', outline:'none', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'2px', textTransform:'uppercase', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)', textAlign:'center' }}
          placeholder="NICKNAME..."
          maxLength={14}
          value={usernameInput}
          onChange={e => setUsernameInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleSetUsername()}
          autoFocus
        />
        <motion.button
          whileTap={{ scale:0.95 }} whileHover={{ skewX:-5 }}
          onClick={handleSetUsername}
          style={{ padding:'12px', background: usernameInput.trim().length >= 2 ? '#cc2200' : '#333', color:'#fff', border:'none', fontFamily:'BlambotClassic, sans-serif', fontSize:'16px', letterSpacing:'3px', cursor: usernameInput.trim().length >= 2 ? 'pointer' : 'default', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)', transition:'background 0.2s' }}
        >
          ENTER ⛓
        </motion.button>
      </div>
    </motion.div>
  )
}

  // ─── CHAT ─────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', flexDirection:'column', height:'100vh', background: T.appBg, fontFamily:'BlambotClassic, "Arial Narrow", sans-serif', position:'relative', overflow:'hidden', backgroundImage:`radial-gradient(circle, ${T.halftone} 1px, transparent 1px)`, backgroundSize:'10px 10px', transition:'background 0.4s' }}>

      {/* top */}
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
            <motion.button whileTap={{ scale:0.9 }} onClick={() => setTheme(t => t==='light' ? 'dark' : 'light')} style={{ background: theme==='light' ? '#111' : '#fff', color: theme==='light' ? '#fff' : '#111', border:`2px solid ${T.headerBorder}`, padding:'4px 10px', fontSize:'12px', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'1px', cursor:'pointer', clipPath:'polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)' }}>
              {theme==='light' ? '◑ DARK' : '◐ LIGHT'}
            </motion.button>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display:'flex', justifyContent:'space-around', background: T.headerBg, padding:'0 8px 8px' }}>
          {[
            { id:'chat',     icon:'/icon_chat.png',     label:'CHATS',    img:'/denji.png'  },
            { id:'rooms',    icon:'/icon_rooms.png',    label:'ROOMS',    img:'/aki.png'    },
            { id:'settings', icon:'/icon_settings.png', label:'SETTINGS', img:'/makima.png' },
            { id:'profile',  icon:'/icon_profile.png',  label:'PROFILE',  img:'/reze.png'   },
          ].map(tab => (
            <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} whileTap={{ y:-12, transition:{ type:'spring', stiffness:500, damping:12 } }} whileHover={{ y:-4 }} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', padding:'4px 12px 0', minWidth:'72px', position:'relative', borderBottom: activeTab===tab.id ? `4px solid ${theme==='light' ? '#cc2200' : '#fff'}` : '4px solid transparent' }}>
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

      {/* ─── TAB: CHAT ─── */}
      {activeTab === 'chat' && (
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Sidebar rooms */}
          <div style={{ width:'155px', background: T.sidebarBg, borderRight:`3px solid ${T.sidebarBorder}`, display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
            <div style={{ padding:'8px 12px', fontSize:'10px', letterSpacing:'2px', color: theme==='light' ? '#999' : '#555', borderBottom:`2px solid ${T.sidebarBorder}`, fontFamily:'BlambotClassic, sans-serif' }}>
              ROOMS
            </div>
            {rooms.map(room => (
              <motion.button key={room.id} whileTap={{ scale:0.97 }} onClick={() => joinRoom(room.id)} style={{ background: currentRoom===room.id ? (theme==='light' ? '#111' : '#fff') : 'transparent', color: currentRoom===room.id ? (theme==='light' ? '#fff' : '#111') : T.titleColor, border:'none', cursor:'pointer', padding:'10px 12px', textAlign:'left', fontFamily:'BlambotClassic, sans-serif', fontSize:'13px', letterSpacing:'1px', borderBottom:`1px solid ${theme==='light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, transition:'all 0.15s' }}>
                {room.name}
                <span style={{ display:'block', fontSize:'9px', opacity:0.5, fontFamily:"'AnimeAce', sans-serif", marginTop:'2px' }}>
                  {room.count} сообщ.
                </span>
              </motion.button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ flex:1, overflowY:'auto', padding:'16px 24px', display:'flex', flexDirection:'column', gap:'10px' }}>
              <AnimatePresence>
                {messages.map((msg, index) => {
                  if (msg.system) return (
                    <motion.div key={msg.id} initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', fontSize:'11px', color: theme==='light' ? '#999' : '#555', fontFamily:"'AnimeAce', sans-serif", letterSpacing:'1px', padding:'4px 0' }}>
                      {msg.content}
                      {/* Message Content */}
{msg.type === 'audio' && msg.audioData ? (
  <audio
    controls
    src={msg.audioData}
    style={{ width:'100%', maxWidth:'220px', marginTop:'4px', filter: theme==='dark' ? 'invert(1)' : 'none' }}
  />
) : (
  msg.content
)}
                    </motion.div>
                  )

                  const isOwn = msg.username === username
                  const isShout = msg.content === msg.content.toUpperCase()
                    && msg.content.replace(/[^a-zA-Zа-яА-Я]/g, '').length > 2

                  return (
                    <motion.div key={msg.id} initial={{ x: isOwn ? 50 : -50, opacity:0 }} animate={{ x:0, opacity:1 }} whileHover={{ scale:1.02 }} transition={{ type:'spring', stiffness:320, damping:28 }} style={{ display:'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', transform:`rotate(${msg.rotate || 0}deg)` }}>
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
                          <div style={{ position:'absolute', bottom:'20px', ...(isOwn ? { right:'-18px', borderTop:'10px solid transparent', borderBottom:'10px solid transparent', borderLeft:`18px solid ${theme==='dark' ? '#fff' : '#111'}` } : { left:'-18px', borderTop:'10px solid transparent', borderBottom:'10px solid transparent', borderRight:`18px solid ${theme==='dark' ? '#fff' : '#111'}` }), zIndex:2 }} />
                          <div style={{ position:'absolute', bottom:'22px', ...(isOwn ? { right:'-13px', borderTop:'8px solid transparent', borderBottom:'8px solid transparent', borderLeft:`14px solid ${theme==='dark' ? '#222' : '#fff'}` } : { left:'-13px', borderTop:'8px solid transparent', borderBottom:'8px solid transparent', borderRight:`14px solid ${theme==='dark' ? '#222' : '#fff'}` }), zIndex:3 }} />
                          <div style={{ position:'relative', maxWidth:'240px', padding:'14px 18px 18px 18px', borderRadius: isOwn ? '50% 50% 20% 50% / 50% 50% 50% 20%' : '50% 50% 50% 20% / 50% 50% 20% 50%', background: theme==='dark' ? '#222' : '#fff', border:`3px solid ${theme==='dark' ? '#fff' : '#111'}`, boxShadow: isOwn ? (theme==='dark' ? '3px 3px 0 #fff' : '3px 3px 0 #111') : (theme==='dark' ? '-3px 3px 0 #fff' : '-3px 3px 0 #111'), color: theme==='dark' ? '#fff' : '#111', fontSize: isShout ? '17px' : '14px', fontWeight: isShout ? 900 : 'normal', fontFamily: isShout ? "'DeathRattle', sans-serif" : "'BlambotClassic', sans-serif", letterSpacing: isShout ? '2px' : 'normal', lineHeight:'1.5', wordBreak:'break-word', overflowWrap:'break-word', transition:'background 0.3s' }}>
                            {msg.content}
                            <span style={{ display:'block', textAlign:'right', fontSize:'10px', marginTop:'6px', color: theme==='dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontFamily:"'AnimeAce', sans-serif" }}>
                              {msg.time} {isOwn && '✓✓'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Typing indicator */}
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

              <div ref={bottomRef} />
            </div>

            {/* input */}
            
            <div style={{ padding:'10px 16px', background: T.inputZoneBg, borderTop:`4px solid ${T.inputBorder}`, display:'flex', gap:'10px', transition:'background 0.4s' }}>
              <motion.button
    whileTap={{ scale:0.9 }}
    onMouseDown={startRecording}
    onMouseUp={stopRecording}
    onTouchStart={startRecording}
    onTouchEnd={stopRecording}
    style={{
      width:'44px', height:'44px', borderRadius:'0',
      background: isRecording ? '#cc2200' : T.inputBg,
      border:`3px solid ${T.inputBorder}`,
      cursor:'pointer', fontSize:'18px',
      display:'flex', alignItems:'center', justifyContent:'center',
      transition:'background 0.2s',
      flexShrink:0,
    }}
  >
    {isRecording ? '⏹' : '🎤'}
  </motion.button>
              <input
                style={{ flex:1, padding:'10px 14px', background: T.inputBg, border:`3px solid ${T.inputBorder}`, color: T.inputColor, fontSize:'14px', outline:'none', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'1px', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)', transition:'background 0.4s' }}
                value={input}
                onChange={handleInputChange}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={`write in ${rooms.find(r=>r.id===currentRoom)?.name || ''}...`}
              />
              <motion.button whileTap={{ scale:0.92, skewX:-5 }} whileHover={{ skewX:-5 }} onClick={sendMessage} style={{ padding:'10px 20px', background: T.btnBg, color: T.btnColor, border:`3px solid ${T.inputBorder}`, fontFamily:'BlambotClassic, sans-serif', fontSize:'14px', letterSpacing:'2px', cursor:'pointer', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)', boxShadow: T.shadow, transition:'background 0.4s' }}>
                VROOM ⛓
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: ROOMS ─── */}
      {activeTab === 'rooms' && (
  <div style={{ flex:1, padding:'20px', overflowY:'auto' }}>

    {/* show the code of the created room */}
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

    {/* Create/Login with Code buttons */}
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

    {/* Creation form */}
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
              onKeyDown={e => e.key === 'Enter' && createRoom()}
            />
            <motion.button whileTap={{ scale:0.95 }} onClick={createRoom} style={{ padding:'10px 20px', background:'#cc2200', color:'#fff', border:'none', fontFamily:'Impact, sans-serif', fontSize:'14px', letterSpacing:'2px', cursor:'pointer' }}>
              CREATE ⛓
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Login form by code */}
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
                onKeyDown={e => e.key === 'Enter' && joinByCode()}
              />
              <motion.button whileTap={{ scale:0.95 }} onClick={joinByCode} style={{ padding:'10px 20px', background: theme==='light' ? '#111' : '#fff', color: theme==='light' ? '#fff' : '#111', border:'none', fontFamily:'Impact, sans-serif', fontSize:'14px', letterSpacing:'2px', cursor:'pointer' }}>
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

    {/* List of rooms */}
    <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'12px' }}>
      {rooms.map(room => (
        <motion.button key={room.id} whileHover={{ scale:1.02, skewX:-2 }} whileTap={{ scale:0.97 }} onClick={() => { joinRoom(room.id); setActiveTab('chat') }} style={{ padding:'16px', background: currentRoom===room.id ? (theme==='light' ? '#111' : '#fff') : 'transparent', color: currentRoom===room.id ? (theme==='light' ? '#fff' : '#111') : T.titleColor, border:`3px solid ${T.headerBorder}`, cursor:'pointer', fontFamily:'Impact, sans-serif', fontSize:'15px', letterSpacing:'1px', textAlign:'left', boxShadow: T.shadow, transition:'all 0.2s', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)' }}>
          <div>{room.name}</div>
          <div style={{ fontSize:'11px', letterSpacing:'3px', opacity:0.5, marginTop:'4px', fontFamily:'Impact, sans-serif' }}>{room.code}</div>
          <div style={{ fontSize:'9px', opacity:0.4, fontFamily:"'AnimeAce', sans-serif", marginTop:'2px' }}>{room.count} сообщ.</div>
          {currentRoom === room.id && <div style={{ fontSize:'10px', color:'#cc2200', marginTop:'4px' }}>● ТЫ ЗДЕСЬ</div>}
        </motion.button>
      ))}
    </div>
  </div>
)}

      {/* ─── TAB: SETTINGS ─── */}
      {activeTab === 'settings' && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
          <img src="/makima.png" style={{ height:'160px', opacity:0.4 }} />
          <span style={{ fontFamily:'BlambotClassic, sans-serif', fontSize:'20px', color: T.titleColor, letterSpacing:'3px' }}>НАСТРОЙКИ — СКОРО</span>
        </div>
      )}

      {/* ─── TAB: PROFILE ─── */}
      {activeTab === 'profile' && (
  <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'20px' }}>
    <img src={avatar.src} style={{ height:'160px', width:'160px', objectFit:'cover', borderRadius:'50%', border:'4px solid #cc2200', boxShadow:'0 0 30px rgba(204,34,0,0.4)' }} />
    <div style={{ fontFamily:'BlambotClassic, sans-serif', textAlign:'center', color: T.titleColor }}>
      <div style={{ fontSize:'28px', letterSpacing:'3px' }}>{username}</div>
      <div style={{ fontSize:'13px', color:'#cc2200', marginTop:'4px', letterSpacing:'2px' }}>{avatar.name}</div>
      <div style={{ fontSize:'12px', opacity:0.5, marginTop:'8px', fontFamily:"'AnimeAce', sans-serif" }}>
        {rooms.find(r=>r.id===currentRoom)?.name}
      </div>
    </div>
  </div>
)}

      {/* ─── POCHITA + HEARTS ─── */}
      <AnimatePresence>
        {pochitaVisible && (
          <>
            {hearts.map(heart => (
              <motion.img key={heart.id} src={`/heart_${heart.id}.png`} initial={{ opacity:0, rotate:heart.rotate, scale:0.5 }} animate={{ opacity:[0,1,1,0], y:'-50vh', scale:[0.5,1.2,1] }} transition={{ duration:2, delay:heart.delay, ease:'easeOut' }} style={{ position:'fixed', bottom:'80px', left:`${heart.x}%`, width:`${heart.size}px`, height:`${heart.size}px`, objectFit:'contain', zIndex:100, pointerEvents:'none' }} />
            ))}
            <motion.img src="/pochita.png" initial={{ y:'200px', rotate:-15 }} animate={{ y:0, rotate:[-15,10,-8,5,0] }} exit={{ y:'200px', rotate:15 }} transition={{ type:'spring', stiffness:200, damping:18 }} style={{ position:'fixed', bottom:'60px', left:'50%', transform:'translateX(-50%)', width:'160px', objectFit:'contain', zIndex:99, pointerEvents:'none', filter:'drop-shadow(0 0 20px rgba(255,100,0,0.6))' }} />
          </>
        )}
      </AnimatePresence>

    </motion.div>
  )
}