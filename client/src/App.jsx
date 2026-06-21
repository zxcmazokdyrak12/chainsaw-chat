import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { motion } from 'framer-motion'
import IntroScreen from './components/IntroScreen'
import UsernameScreen, { AVATARS } from './components/UsernameScreen'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MessageBubble from './components/MessageBubble'
import ContextMenu from './components/ContextMenu'
import TypingIndicator from './components/TypingIndicator'
import InputBar from './components/InputBar'
import RoomsTab from './components/RoomsTab'
import SettingsTab from './components/SettingsTab'
import ProfileTab from './components/ProfileTab'
import PochitaEgg from './components/PochitaEgg'

const socket = io('https://chainsaw-chat.onrender.com', {
  transports: ['websocket', 'polling']
})

const CHAINSAW_SFX = '/chainsaw.mp3'
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
  const [createdCode, setCreatedCode]       = useState('')
  const [isRecording, setIsRecording]       = useState(false)
  const mediaRecorder = useRef(null)
  const audioChunks   = useRef([])
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [contextMenu, setContextMenu] = useState(null)

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
            socket.emit('get_rooms', { username: user.username })
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
      setCreatedCode(code)
      joinRoom(id)
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = '/'
  }

  if (phase === 'intro' || phase === 'slashing') {
    return <IntroScreen phase={phase} onStart={handleStart} />
  }

  if (phase === 'username') {
    return (
      <UsernameScreen
        avatar={avatar}
        onAvatarChange={setAvatar}
        usernameInput={usernameInput}
        onUsernameInputChange={(v) => setUsernameInput(v.toUpperCase())}
        onSubmit={handleSetUsername}
      />
    )
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', flexDirection:'column', height:'100vh', background: T.appBg, fontFamily:'BlambotClassic, "Arial Narrow", sans-serif', position:'relative', overflow:'hidden', backgroundImage:`radial-gradient(circle, ${T.halftone} 1px, transparent 1px)`, backgroundSize:'10px 10px', transition:'background 0.4s' }}>

      <Header
        T={T} theme={theme} username={username}
        rooms={rooms} currentRoom={currentRoom}
        activeTab={activeTab} onTabChange={setActiveTab}
        onThemeToggle={() => setTheme(t => t==='light' ? 'dark' : 'light')}
      />

      {activeTab === 'chat' && (
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          <Sidebar
            rooms={rooms} currentRoom={currentRoom}
            theme={theme} T={T} onJoinRoom={joinRoom}
          />
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div
              onScroll={() => setContextMenu(null)}
              style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {messages.map((msg, index) => {
                if (msg.system) return (
                  <motion.div key={msg.id} initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ textAlign:'center', fontSize:'11px', color: theme==='light' ? '#999' : '#555', fontFamily:"'AnimeAce', sans-serif", letterSpacing:'1px', padding:'4px 0' }}>
                    {msg.content}
                  </motion.div>
                )
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={msg} index={index}
                    isOwn={msg.username === username}
                    theme={theme} T={T}
                    onContextMenu={setContextMenu}
                  />
                )
              })}

              <ContextMenu
                contextMenu={contextMenu} theme={theme}
                username={username}
                onDelete={(msgId) => { socket.emit('delete_message', { messageId: msgId, roomId: currentRoom }); setContextMenu(null) }}
                onCopy={(content) => { navigator.clipboard.writeText(content); setContextMenu(null) }}
                onClose={() => setContextMenu(null)}
              />

              <TypingIndicator typingUsers={typingUsers} theme={theme} />

              <div ref={bottomRef} />
            </div>

            <InputBar
              input={input} onInputChange={handleInputChange}
              onSend={sendMessage}
              isRecording={isRecording}
              onStartRecording={startRecording} onStopRecording={stopRecording}
              T={T} theme={theme} currentRoom={currentRoom} rooms={rooms}
            />
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <RoomsTab
          rooms={rooms} currentRoom={currentRoom}
          theme={theme} T={T}
          onJoinRoom={joinRoom} onSwitchToChat={() => setActiveTab('chat')}
          showCreateRoom={showCreateRoom} setShowCreateRoom={setShowCreateRoom}
          showJoinByCode={showJoinByCode} setShowJoinByCode={setShowJoinByCode}
          newRoomName={newRoomName} setNewRoomName={setNewRoomName}
          joinCode={joinCode} setJoinCode={setJoinCode}
          joinError={joinError} setJoinError={setJoinError}
          createdCode={createdCode} setCreatedCode={setCreatedCode}
          onCreateRoom={createRoom} onJoinByCode={joinByCode}
        />
      )}

      {activeTab === 'settings' && <SettingsTab T={T} />}

      {activeTab === 'profile' && (
        <ProfileTab
          avatar={avatar} username={username}
          rooms={rooms} currentRoom={currentRoom}
          T={T} theme={theme} onLogout={handleLogout}
        />
      )}

      <PochitaEgg visible={pochitaVisible} hearts={hearts} />

    </motion.div>
  )
}
