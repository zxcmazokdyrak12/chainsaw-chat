import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { io, type Socket } from 'socket.io-client'
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
import DateDivider from './components/DateDivider'
import { groupMessagesByDate } from './utils/dateGroups'
import { useSettings } from './hooks/useSettings'
import BottomNav from './components/BottomNav'
import { useWindowSize } from './hooks/useWindowSize'

const socket: Socket = io('https://chainsaw-chat.onrender.com', {
  transports: ['websocket', 'polling']
})

const CHAINSAW_SFX = '/chainsaw.mp3'
const CUTE_WORDS = ['honey','baby','darling','sweetie','angel','sunshine','bunny','kitty', 'cute', 'love', 'sweet', 'aww', '❤️', '🥺', '💕', '😍', '🐾']

export interface ThemeTokens {
  [key: string]: string
  appBg: string
  headerBg: string
  headerBorder: string
  inputZoneBg: string
  inputBorder: string
  inputBg: string
  inputColor: string
  nameColor: string
  sfxColor: string
  titleColor: string
  titleAccent: string
  btnBg: string
  btnColor: string
  shadow: string
  halftone: string
  sidebarBg: string
  sidebarBorder: string
}

const LIGHT: ThemeTokens = {
  appBg: '#f0ebe0', headerBg: '#e8e3d8', headerBorder: '#111',
  inputZoneBg: '#e8e3d8', inputBorder: '#111', inputBg: '#fff', inputColor: '#111',
  nameColor: '#cc2200', sfxColor: '#cc2200', titleColor: '#111', titleAccent: '#cc2200',
  btnBg: '#111', btnColor: '#fff', shadow: '5px 5px 0 rgba(0,0,0,0.85)',
  halftone: 'rgba(0,0,0,0.07)', sidebarBg: '#e0dbd0', sidebarBorder: '#111',
}

const DARK: ThemeTokens = {
  appBg: '#111', headerBg: '#0a0a0a', headerBorder: '#fff',
  inputZoneBg: '#0a0a0a', inputBorder: '#fff', inputBg: '#1a1a1a', inputColor: '#fff',
  nameColor: '#fff', sfxColor: '#fff', titleColor: '#fff', titleAccent: '#fff',
  btnBg: '#fff', btnColor: '#111', shadow: '5px 5px 0 rgba(255,255,255,0.15)',
  halftone: 'rgba(255,255,255,0.03)', sidebarBg: '#0a0a0a', sidebarBorder: '#fff',
}

export interface MessageItem {
  id: string | number
  username?: string
  content: string
  avatar?: string
  system?: boolean
  time?: string
  type?: 'text' | 'audio' | string
  audioData?: string | ArrayBuffer | null
}

export interface RoomItem {
  id: string
  name: string
  count: number | string
  code: string
}

export interface AvatarItem {
  id: string
  name: string
  src: string
}

export interface ContextMenuState {
  x: number
  y: number
  msg: any
}

interface GroupedItem {
  type: 'divider' | 'message' | string
  label?: string
  data?: any
}

export default function App() {
  const [phase, setPhase]                   = useState<'intro' | 'slashing' | 'username' | 'chat' | string>('intro')
  const [username, setUsername]             = useState<string>('')
  const [usernameInput, setUsernameInput]   = useState<string>('')
  const [messages, setMessages]             = useState<MessageItem[]>([])
  const [input, setInput]                   = useState<string>('')
  const [activeTab, setActiveTab]           = useState<'chat' | 'rooms' | 'settings' | 'profile' | string>('chat')
  const [currentRoom, setCurrentRoom]       = useState<string>('general')
  const [rooms, setRooms]                   = useState<RoomItem[]>([])
  const [typingUsers, setTypingUsers]       = useState<string[]>([])
  const [pochitaVisible, setPochitaVisible] = useState<boolean>(false)
  const [hearts, setHearts]                 = useState<any[]>([])
  
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const [showCreateRoom, setShowCreateRoom] = useState<boolean>(false)
  const [showJoinByCode, setShowJoinByCode] = useState<boolean>(false)
  const [newRoomName, setNewRoomName]       = useState<string>('')
  const [joinCode, setJoinCode]             = useState<string>('')
  const [joinError, setJoinError]           = useState<string>('')
  const [createdCode, setCreatedCode]       = useState<string>('')
  const [isRecording, setIsRecording]       = useState<boolean>(false)
  const { isMobile } = useWindowSize()
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks   = useRef<Blob[]>([])
  
  const [avatar, setAvatar] = useState<AvatarItem>(AVATARS[0] as AvatarItem)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [pinnedMsg, setPinnedMsg] = useState<MessageItem | null>(null)

  const { settings, update: updateSetting, resolveTheme } = useSettings()
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'system'>(() => resolveTheme() as 'light' | 'dark' | 'system')

  useEffect(() => {
    setResolvedTheme(resolveTheme() as 'light' | 'dark' | 'system')
  }, [settings.theme, resolveTheme])

  useEffect(() => {
    if (settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  const theme = resolvedTheme
  const T: ThemeTokens = theme === 'light' ? LIGHT : DARK

  const playSound = (src: string, volume: number = 0.4): void => {
    if (!settings.soundEnabled) return
    const audio = new Audio(src)
    audio.volume = volume
    audio.play().catch(() => {})
  }

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
              : (AVATARS[0] as AvatarItem)
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

  const triggerPochita = (text: string): void => {
    if (!settings.pochitaEnabled) return
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
    socket.on('message_pinned', ({ messageId, pinStatus }: { messageId: string | number, pinStatus: boolean }) => {
      if (pinStatus) {
        const msg = messages.find(m => m.id === messageId)
        setPinnedMsg(msg || null)
      } else {
        setPinnedMsg(null)
      }
    })

    return () => {
      socket.off('message_pinned')
    }
  }, [messages])

  useEffect(() => {
    socket.on('rooms_list', (list: RoomItem[]) => setRooms(list))
    socket.on('room_history', (history: MessageItem[]) => setMessages(history))
    socket.on('receive_message', (msg: MessageItem) => {
      setMessages(p => [...p, msg])
      triggerPochita(msg.content)
    })
    socket.on('room_created', ({ id }: { id: string, code: string, name: string }) => {
      joinRoom(id)
      setShowCreateRoom(false)
      setNewRoomName('')
    })
    socket.on('join_by_code_success', ({ roomId }: { roomId: string }) => {
      joinRoom(roomId)
      setShowJoinByCode(false)
      setJoinCode('')
      setJoinError('')
      setActiveTab('chat')
    })
    socket.on('join_error', (msg: string) => {
      setJoinError(msg)
    })
    socket.on('typing_update', (users: string[]) => setTypingUsers(users))
    socket.on('user_joined', ({ username: who }: { username: string }) => {
      setMessages(p => [...p, {
        id: Date.now(), system: true,
        content: `${who} joined the room`,
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
      }])
    })
    socket.on('message_deleted', ({ messageId }: { messageId: string | number }) => {
      setMessages(p => p.filter(m => m.id !== messageId))
    })

    return () => {
      socket.off('rooms_list')
      socket.off('room_history')
      socket.off('receive_message')
      socket.off('typing_update')
      socket.off('user_joined')
      socket.off('message_deleted')
    }
  }, [username, avatar])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const joinRoom = (roomId: string): void => {
    setCurrentRoom(roomId)
    setMessages([])
    setTypingUsers([])
    socket.emit('join_room', { roomId, username, avatar: avatar.src })
  }

  const handleSetUsername = (): void => {
    if (usernameInput.trim().length < 2) return
    const name = usernameInput.trim().toUpperCase()
    setUsername(name)
    setPhase('chat')
    setTimeout(() => {
      socket.emit('join_room', { roomId: 'general', username: name, avatar: avatar.src })
    }, 100)
  }

  const handleStart = (): void => {
    playSound(CHAINSAW_SFX, 0.5)
    setPhase('slashing')
    setTimeout(() => setPhase('username'), 1200)
  }

  const sendMessage = (): void => {
    if (!input.trim()) return
    const isAllCaps = input.trim() === input.trim().toUpperCase()
      && input.trim().replace(/[^a-zA-Zа-яА-Я]/g, '').length > 2
    if (isAllCaps && Math.random() < 0.1) {
      playSound(CHAINSAW_SFX, 0.4)
    }
    socket.emit('send_message', { roomId: currentRoom, username, content: input.trim(), avatar: avatar.src })
    socket.emit('typing_stop', { roomId: currentRoom })
    setInput('')
  }

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value)
    if (settings.showTyping) {
      socket.emit('typing_start', { roomId: currentRoom, username })
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => {
        socket.emit('typing_stop', { roomId: currentRoom })
      }, 1500)
    }
  }

  const startRecording = async (): Promise<void> => {
    try {
      // NATIVE PLATFORM (Capacitor) requires explicit permission request for microphone access
      if (window && (window as any).Capacitor && (window as any).Capacitor.isNativePlatform) {
        try {
          await (window as any).Capacitor.Plugins.Permissions.requestPermission({ name: 'microphone' });
        } catch (pe) {
          console.warn(pe);
        }
      }

      // default getUserMedia call
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg;codecs=opus'
   
      mediaRecorder.current = new MediaRecorder(stream, { mimeType })
      audioChunks.current = []
   
      mediaRecorder.current.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) audioChunks.current.push(e.data)
      }
   
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mimeType })
   
        if (blob.size > 900_000) {
          alert('Voice message too long! Keep it under ~30 seconds.')
          stream.getTracks().forEach(t => t.stop())
          return
        }
   
        const reader = new FileReader()
        reader.onloadend = () => {
          socket.emit('send_message', {
            roomId: currentRoom,
            username,
            avatar: avatar.src,
            content: '🎤 voice message',
            type: 'audio',
            audioData: reader.result,
          })
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
   
      // Убрали (250), пишем одним куском, чтобы веб на ПК не дохнул
      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (e) {
      console.error(e)
      alert('Microphone access denied')
    }
  }

  const stopRecording = (): void => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  const createRoom = (): void => {
    socket.emit('create_room', { username, roomName: newRoomName })
  }

  const joinByCode = (): void => {
    if (joinCode.trim().length < 6) return
    socket.emit('join_by_code', { code: joinCode.trim(), username })
  }

  const handleLogout = (): void => {
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

  const groupedItems: GroupedItem[] = groupMessagesByDate(messages)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        display: 'flex', 
        flexDirection: 'column', 
        height: '100dvh', 
        background: T.appBg,
        fontFamily: 'BlambotClassic, "Arial Narrow", sans-serif',
        fontSize: 'var(--font-size-base, 14px)',
        position: 'relative', 
        overflow: 'hidden',
        backgroundImage: `radial-gradient(circle, ${T.halftone} 1px, transparent 1px)`,
        backgroundSize: '10px 10px',
        transition: 'background 0.4s',
      }}
    >
      {/* header */}
      <Header
        T={T} theme={theme} username={username}
        rooms={rooms} currentRoom={currentRoom}
        activeTab={activeTab} onTabChange={setActiveTab}
        onThemeToggle={() => updateSetting('theme', theme === 'light' ? 'dark' : 'light')}
      />

      {/* main content */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}>
        
        {/* ВКЛАДКА ЧАТА */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* fix #2: Hide Sidebar on mobile to prevent layout issues */}
            {!isMobile && (
              <Sidebar
                rooms={rooms} currentRoom={currentRoom}
                theme={theme} T={T} onJoinRoom={joinRoom}
              />
            )}
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* message area */}
              <div
                onScroll={() => setContextMenu(null)}
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: isMobile ? '12px 16px' : '16px 24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px' 
                }}
              >
                {pinnedMsg && (
                  <div style={{
                    padding: '8px 14px',
                    background: theme === 'dark' ? '#1a1a1a' : '#f0ebe0',
                    border: `2px solid #cc2200`,
                    borderLeft: '4px solid #cc2200',
                    fontFamily: "'AnimeAce', sans-serif",
                    fontSize: '11px', color: T.titleColor,
                    display: 'flex', gap: '8px', alignItems: 'center',
                  }}>
                    <span style={{ color: '#cc2200' }}>📌</span>
                    <span style={{ opacity: 0.6 }}>PINNED:</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pinnedMsg.content}
                    </span>
                  </div>
                )}
                
                {groupedItems.map((item, index) => {
                  if (item.type === 'divider') {
                    return <DateDivider key={`divider-${item.label}-${index}`} label={item.label || ''} theme={theme} />
                  }

                  const msg = item.data
                  if (msg.system) return (
                    <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', fontSize: '11px', color: theme === 'light' ? '#999' : '#555', fontFamily: "'AnimeAce', sans-serif", letterSpacing: '1px', padding: '4px 0' }}>
                      {msg.content}
                    </motion.div>
                  )
                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg} index={index}
                      isOwn={msg.username === username}
                      theme={theme} T={T}
                      onContextMenu={(data) => setContextMenu({ x: data.x, y: data.y, msg: data.msg })}
                    />
                  )
                })}

                <ContextMenu
                  contextMenu={contextMenu} theme={theme}
                  username={username}
                  onDelete={(msgId) => {
                    socket.emit('delete_message', { messageId: msgId, roomId: currentRoom })
                    setContextMenu(null)
                  }}
                  onCopy={(content) => { navigator.clipboard.writeText(content); setContextMenu(null) }}
                  onClose={() => setContextMenu(null)}
                />

                <TypingIndicator typingUsers={typingUsers} theme={theme} />
                <div ref={bottomRef} />
              </div>

              {/* fix #3: Input field (now always at the bottom of the chat section and above BottomNav) */}
              <div style={{ paddingBottom: isMobile ? '60px' : '0' }}>
                <InputBar
                  input={input}
                  onInputChange={handleInputChange}
                  onSend={sendMessage}
                  isRecording={isRecording}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  T={T} theme={theme}
                  currentRoom={currentRoom} rooms={rooms}
                  sendOnEnter={settings.sendOnEnter}
                />
              </div>
            </div>
          </div>
        )}

        {/*_rooms tab */}
        {activeTab === 'rooms' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: isMobile ? '70px' : '0' }}>
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
          </div>
        )}

        {/* fix #4: SETTINGS TAB (Added internal scroll, so it scrolls on mobile) */}
        {activeTab === 'settings' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: isMobile ? '70px' : '0' }}>
            <SettingsTab
              T={T}
              settings={settings}
              onUpdate={updateSetting}
            />
          </div>
        )}

        {/* profile */}
        {activeTab === 'profile' && (
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: isMobile ? '70px' : '0' }}>
            <ProfileTab
              avatar={avatar} username={username}
              rooms={rooms} currentRoom={currentRoom}
              T={T} theme={theme}
              onLogout={handleLogout}
              onAvatarChange={(newAv: any) => setAvatar({ id: String(newAv.id), name: newAv.name, src: newAv.src })}
            />
          </div>
        )}
      </div>

      {/* bottom mobile nav. panel */}
      {isMobile && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 }}>
          <BottomNav
            activeTab={activeTab}
            theme={theme}
            T={T}
            onTabChange={setActiveTab}
          />
        </div>
      )}

      <PochitaEgg visible={pochitaVisible} hearts={hearts} />
    </motion.div>
  )
}