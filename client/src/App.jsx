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

  const T = theme === 'light' ? LIGHT : DARK

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
    socket.emit('join_room', { roomId, username })
  }

  const handleSetUsername = () => {
    if (usernameInput.trim().length < 2) return
    const name = usernameInput.trim().toUpperCase()
    setUsername(name)
    setPhase('chat')
    setTimeout(() => {
      socket.emit('join_room', { roomId: 'general', username: name })
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
    socket.emit('send_message', { roomId: currentRoom, username, content: input.trim() })
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
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ height:'100vh', background:'#0d0d0d', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'24px', fontFamily:'BlambotClassic, sans-serif' }}>
        <h1 style={{ fontSize:'42px', color:'#fff', letterSpacing:'4px', textShadow:'4px 4px 0 #cc2200', margin:0 }}>
          CHAINSAW <span style={{ color:'#cc2200' }}>CHAT</span>
        </h1>
        <p style={{ color:'#555', fontSize:'12px', letterSpacing:'3px', margin:0 }}>WHAT'S YOUR NICKNAME?</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px', width:'300px' }}>
          <input
            style={{ padding:'14px 20px', background:'#1a1a1a', border:'3px solid #fff', color:'#fff', fontSize:'18px', outline:'none', fontFamily:'BlambotClassic, sans-serif', letterSpacing:'2px', textTransform:'uppercase', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)', textAlign:'center' }}
            placeholder="NICKNAME...  "
            maxLength={14}
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleSetUsername()}
            autoFocus
          />
          <motion.button whileTap={{ scale:0.95 }} whileHover={{ skewX:-5 }} onClick={handleSetUsername} style={{ padding:'14px', background: usernameInput.trim().length >= 2 ? '#cc2200' : '#333', color:'#fff', border:'none', fontFamily:'BlambotClassic, sans-serif', fontSize:'18px', letterSpacing:'3px', cursor: usernameInput.trim().length >= 2 ? 'pointer' : 'default', clipPath:'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)', transition:'background 0.2s' }}>
            ENTER ⛓
          </motion.button>
        </div>
        <div style={{ display:'flex', gap:'12px', marginTop:'8px' }}>
          {['/denji.png','/aki.png','/makima.png','/reze.png'].map((img, i) => (
            <motion.img key={i} src={img} initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:i*0.1, type:'spring' }} style={{ height:'70px', objectFit:'contain', filter:'grayscale(30%)' }} />
          ))}
        </div>
      </motion.div>
    )
  }

  // ─── CHAT ─────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', flexDirection:'column', height:'100vh', background: T.appBg, fontFamily:'BlambotClassic, "Arial Narrow", sans-serif', position:'relative', overflow:'hidden', backgroundImage:`radial-gradient(circle, ${T.halftone} 1px, transparent 1px)`, backgroundSize:'10px 10px', transition:'background 0.4s' }}>

      {/* Шапка */}
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
                        <span style={{ fontSize:'10px', letterSpacing:'2px', color: isOwn ? (theme==='light' ? '#666' : '#555') : T.nameColor, paddingLeft: isOwn ? 0 : '14px', paddingRight: isOwn ? '14px' : 0, fontFamily:"'AnimeAce', sans-serif" }}>
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
          <img src="/reze.png" style={{ height:'140px', objectFit:'contain' }} />
          <div style={{ fontFamily:'BlambotClassic, sans-serif', textAlign:'center', color: T.titleColor }}>
            <div style={{ fontSize:'28px', letterSpacing:'3px' }}>{username}</div>
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