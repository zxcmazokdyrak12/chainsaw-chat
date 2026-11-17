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
import { useVideoCall } from './hooks/useVideoCall'
import VideoCall from './components/VideoCall'
import StickerBomb from './components/StickerBomb'
import Tutorial from './components/Tutorial'
import { API_URL } from './config'

const socket: Socket = io(API_URL, {
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

// manga page: black ink on newsprint. Greys come from screentone (see index.css), not from flat fills.
const LIGHT: ThemeTokens = {
  appBg: '#f5f2ea', headerBg: '#f5f2ea', headerBorder: '#111',
  inputZoneBg: '#f5f2ea', inputBorder: '#111', inputBg: '#fbf9f4', inputColor: '#111',
  nameColor: '#111', sfxColor: '#111', titleColor: '#111', titleAccent: '#111',
  btnBg: '#111', btnColor: '#f5f2ea', shadow: '4px 4px 0 #111',
  halftone: 'rgba(0,0,0,0.07)', sidebarBg: '#f5f2ea', sidebarBorder: '#111',
}

// "negative" page: white ink on black, like Fujimoto's inverted spreads
const DARK: ThemeTokens = {
  appBg: '#0e0e0e', headerBg: '#0e0e0e', headerBorder: '#f2efe6',
  inputZoneBg: '#0e0e0e', inputBorder: '#f2efe6', inputBg: '#161616', inputColor: '#f2efe6',
  nameColor: '#f2efe6', sfxColor: '#f2efe6', titleColor: '#f2efe6', titleAccent: '#f2efe6',
  btnBg: '#f2efe6', btnColor: '#111', shadow: '4px 4px 0 #f2efe6',
  halftone: 'rgba(255,255,255,0.04)', sidebarBg: '#0e0e0e', sidebarBorder: '#f2efe6',
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
  reactions?: Record<string, string[]>
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

  const [authError, setAuthError]     = useState<string>('')
  const [authLoading, setAuthLoading] = useState<boolean>(false)
  // username → id of the last message they've seen in the current room
  const [seenMarks, setSeenMarks] = useState<Record<string, number>>({})
  const lastMarked = useRef<number>(0)

  const call = useVideoCall(socket, currentRoom, username)

  // onboarding tour — shown once after the first time you get into the chat
  const [tourOpen, setTourOpen] = useState<boolean>(false)
  // tab switch = quick screentone cut: tone covers the page (90ms), page swaps, tone dissolves (120ms)
  const [toneCut, setToneCut] = useState<boolean>(false)
  const cutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const switchTab = (tab: string): void => {
    if (tab === activeTab) return
    if (cutTimer.current) clearTimeout(cutTimer.current)
    setToneCut(true)
    cutTimer.current = setTimeout(() => { setActiveTab(tab); setToneCut(false) }, 90)
  }
  const startTour = (): void => { setActiveTab('chat'); setTimeout(() => setTourOpen(true), 350) }
  const closeTour = (): void => {
    setTourOpen(false)
    try { localStorage.setItem('chainsaw_tutorial_done', '1') } catch { /* private mode */ }
  }
  useEffect(() => {
    if (phase !== 'chat') return
    let done = false
    try { done = localStorage.getItem('chainsaw_tutorial_done') === '1' } catch { /* ignore */ }
    if (done) return
    const t = setTimeout(() => setTourOpen(true), 1200) // let the room load first
    return () => clearTimeout(t)
  }, [phase])

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
  // css variables (--ink, --paper, --accent…) follow the theme
  useEffect(() => { document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light' }, [theme])
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
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${saved}` }
      })
        .then(r => r.json())
        .then(user => {
          if (user.username) enterChat(user)
          else localStorage.removeItem('token')
        })
        .catch(() => localStorage.removeItem('token'))
    }
  }, [])

  // shared entry point for OAuth tokens and login/password accounts
  const enterChat = (user: { username: string; avatar?: string | null }, fallback: AvatarItem = AVATARS[0] as AvatarItem): void => {
    const chosen: AvatarItem = user.avatar
      ? { id: 'account', name: user.username, src: user.avatar }
      : fallback
    setUsername(user.username)
    setAvatar(chosen)
    setPhase('chat')
    socket.emit('get_rooms', { username: user.username })
    setTimeout(() => {
      socket.emit('join_room', { roomId: 'general', username: user.username, avatar: chosen.src })
    }, 100)
  }

  const handleAccountAuth = async (mode: 'login' | 'register', password: string): Promise<void> => {
    const name = usernameInput.trim().toUpperCase()
    if (name.length < 2 || password.length < 6 || authLoading) return
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch(`${API_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, password, avatar: avatar.src }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.token) {
        setAuthError(data.error || (res.status === 429 ? 'Too many tries, wait a bit' : 'Server error'))
        return
      }
      localStorage.setItem('token', data.token)
      playSound(CHAINSAW_SFX, 0.4)
      enterChat(data.user, avatar)
    } catch {
      setAuthError('Server is sleeping, try again')
    } finally {
      setAuthLoading(false)
    }
  }

  // persist character choice for login/password accounts (OAuth accounts just ignore it)
  const handleAvatarChange = (newAv: { id: string | number; name: string; src: string }): void => {
    setAvatar({ id: String(newAv.id), name: newAv.name, src: newAv.src })
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${API_URL}/auth/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ avatar: newAv.src }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.token) localStorage.setItem('token', data.token) })
      .catch(() => {})
  }

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
    socket.on('message_reacted', ({ messageId, reactions }: { messageId: string | number, reactions: Record<string, string[]> }) => {
      setMessages(p => p.map(m => (m.id === messageId ? { ...m, reactions } : m)))
    })
    socket.on('seen_state', ({ marks }: { roomId: string, marks: Record<string, number> }) => {
      setSeenMarks(marks)
    })
    socket.on('seen_update', ({ username: who, lastReadId }: { roomId: string, username: string, lastReadId: number }) => {
      setSeenMarks(p => ({ ...p, [who]: Math.max(p[who] ?? 0, lastReadId) }))
    })

    return () => {
      socket.off('rooms_list')
      socket.off('room_history')
      socket.off('receive_message')
      socket.off('typing_update')
      socket.off('user_joined')
      socket.off('message_deleted')
      socket.off('message_reacted')
      socket.off('seen_state')
      socket.off('seen_update')
    }
  }, [username, avatar])

  // socket.io reconnects by itself (Render naps, phone goes to background), but the new socket
  // is not in any room — rejoin, otherwise reactions / calls / messages silently go nowhere
  const sessionRef = useRef({ phase, username, currentRoom, avatarSrc: avatar.src })
  sessionRef.current = { phase, username, currentRoom, avatarSrc: avatar.src }
  useEffect(() => {
    let firstConnect = true
    const onConnect = () => {
      if (firstConnect) { firstConnect = false; return }
      const s = sessionRef.current
      if (s.phase !== 'chat' || !s.username) return
      socket.emit('get_rooms', { username: s.username })
      socket.emit('join_room', { roomId: s.currentRoom, username: s.username, avatar: s.avatarSrc })
    }
    const onReactError = (msg: string) => console.warn('[reaction]', msg)
    if (socket.connected) firstConnect = false
    socket.on('connect', onConnect)
    socket.on('react_error', onReactError)
    return () => { socket.off('connect', onConnect); socket.off('react_error', onReactError) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  // tell the room which message we've seen last (only when the chat is actually on screen)
  useEffect(() => {
    const markSeen = () => {
      if (phase !== 'chat' || activeTab !== 'chat' || document.visibilityState !== 'visible') return
      const last = [...messages].reverse().find(m => !m.system && typeof m.id === 'number')
      if (!last || (last.id as number) <= lastMarked.current) return
      lastMarked.current = last.id as number
      socket.emit('mark_seen', { roomId: currentRoom, messageId: last.id, username })
    }
    markSeen()
    document.addEventListener('visibilitychange', markSeen)
    return () => document.removeEventListener('visibilitychange', markSeen)
  }, [messages, activeTab, currentRoom, phase])

  const joinRoom = (roomId: string): void => {
    setCurrentRoom(roomId)
    setMessages([])
    setTypingUsers([])
    setSeenMarks({})
    lastMarked.current = 0
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
      if (window && (window as any).Capacitor && (window as any).Capacitor.isNativePlatform) {
        try {
          await (window as any).Capacitor.Plugins.Permissions.requestPermission({ name: 'microphone' });
        } catch (pe) {
          console.warn(pe);
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Настройка для Firefox с resistFingerprinting: 
      // Не перебираем mimeType вручную, а даем браузеру использовать дефолтный системный контейнер
      let options = {};
      
      // Если это Firefox/Линукс/Мак с защитой, принудительный opus в webm может ломаться.
      // Проверяем только самый базовый вариант, иначе оставляем пустой объект
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }
   
      mediaRecorder.current = new MediaRecorder(stream, options);
      audioChunks.current = [];
   
      mediaRecorder.current.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };
   
      mediaRecorder.current.onstop = async () => {
        if (audioChunks.current.length === 0) {
          console.error("Чанки аудио пусты!");
          return;
        }
   
        const finalType = mediaRecorder.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunks.current, { type: finalType });

        if (blob.size > 3 * 1024 * 1024) { 
          alert('Voice message too long!');
          stream.getTracks().forEach(t => t.stop());
          return;
        }
   
        // Обернем FileReader в Promise, чтобы гарантировать отправку ТЕКСТА, а не битого объекта
        const readBlobAsBase64 = (audioBlob: Blob): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              let res = reader.result as string;
              if (res && res.includes('data:application/octet-stream;base64,')) {
                res = res.replace('data:application/octet-stream;base64,', `data:${finalType};base64,`);
              }
              resolve(res);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(audioBlob);
          });
        };

        try {
          const base64Audio = await readBlobAsBase64(blob);

          if (!base64Audio || base64Audio.length < 100) {
            console.error('Сгенерирована слишком короткая или пустая Base64 строка');
            return;
          }

          socket.emit('send_message', {
            roomId: currentRoom,
            username,
            avatar: avatar.src,
            content: '🎤 voice message',
            type: 'audio',
            audioData: base64Audio,
          });
        } catch (err) {
          console.error('Ошибка при чтении Blob в Base64:', err);
        }

        // Выключаем микрофон
        stream.getTracks().forEach(t => t.stop());
      };
   
      // Запускаем без параметров времени
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      alert('Microphone access denied');
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
    call.leave()
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
        onAccountSubmit={handleAccountAuth}
        authError={authError}
        authLoading={authLoading}
        onClearError={() => setAuthError('')}
      />
    )
  }

  const groupedItems: GroupedItem[] = groupMessagesByDate(messages)

  // furthest message any *other* member has seen → everything of ours up to it is SEEN
  const seenByOthers = Object.entries(seenMarks)
    .filter(([who]) => who !== username)
    .reduce<number>((max, [, id]) => Math.max(max, Number(id)), 0)

  const reactTo = (messageId: string | number, emoji: string): void => {
    socket.emit('react_message', { messageId, roomId: currentRoom, emoji, username })
  }

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
        activeTab={activeTab} onTabChange={switchTab}
        onThemeToggle={() => updateSetting('theme', theme === 'light' ? 'dark' : 'light')}
        callCount={call.participants.length}
        inCall={call.inCall}
        onCall={() => { setActiveTab('chat'); call.join() }}
      />

      {/* main content */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* quick cut between tabs */}
        <motion.div
          className="tone"
          initial={false}
          animate={{ opacity: toneCut ? 1 : 0 }}
          transition={{ duration: toneCut ? 0.09 : 0.12, ease: 'linear' }}
          style={{
            position: 'absolute', inset: 0, zIndex: 60, pointerEvents: 'none',
            backgroundColor: T.appBg,
          }}
        />
        
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
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              {/* stickerbomb layer — behind messages, one layout per room */}
              <StickerBomb
                density={settings.stickerBomb ?? 'light'}
                dark={theme === 'dark'}
                mode={settings.stickerBomb === 'full' ? 'everywhere' : 'edges'}
                seed={currentRoom}
              />
              {/* message area */}
              <div
                data-tour="messages"
                onScroll={() => setContextMenu(null)}
                style={{ 
                  position: 'relative', zIndex: 1,
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: isMobile ? '12px 16px' : '16px 24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px' 
                }}
              >
                {call.participants.length > 0 && !call.inCall && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--accent)', color: 'var(--on-accent)',
                      border: `3px solid ${theme === 'dark' ? '#fff' : '#111'}`,
                      boxShadow: theme === 'dark' ? '4px 4px 0 #fff' : '4px 4px 0 #111',
                      fontFamily: "'AnimeAce', sans-serif", fontSize: '11px',
                      display: 'flex', gap: '10px', alignItems: 'center',
                      transform: 'rotate(-0.5deg)',
                    }}
                  >
                    <span style={{ fontFamily: "'CCDoohickey', BlambotClassic, sans-serif", fontStyle: 'italic', fontWeight: 900, fontSize: '14px' }}>BZZZT!</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📹 CALL: {call.participants.join(', ')}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.92 }} whileHover={{ skewX: -5 }}
                      onClick={call.join}
                      style={{
                        background: '#fff', color: '#111', border: '2px solid #111',
                        padding: '4px 12px', cursor: 'pointer',
                        fontFamily: 'BlambotClassic, sans-serif', fontSize: '12px', letterSpacing: '2px',
                        clipPath: 'polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)',
                      }}
                    >
                      JOIN ⛓
                    </motion.button>
                  </motion.div>
                )}

                {pinnedMsg && (
                  <div style={{
                    padding: '8px 14px',
                    background: theme === 'dark' ? '#1a1a1a' : '#f0ebe0',
                    border: `2px solid var(--accent)`,
                    borderLeft: '4px solid var(--accent)',
                    fontFamily: "'AnimeAce', sans-serif",
                    fontSize: '11px', color: T.titleColor,
                    display: 'flex', gap: '8px', alignItems: 'center',
                  }}>
                    <span style={{ color: 'var(--accent)' }}>📌</span>
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
                    // narration caption — the rectangular box in a panel corner
                    <motion.div key={msg.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                      <span style={{
                        display: 'inline-block', transform: 'rotate(-1deg)',
                        border: '3px solid var(--ink)', backgroundColor: 'var(--paper)',
                        boxShadow: '3px 3px 0 var(--ink)', color: 'var(--ink)',
                        padding: '4px 12px', fontSize: '11px',
                        fontFamily: "'AnimeAce', sans-serif", letterSpacing: '1px',
                      }}>
                        ▶ {msg.content}
                      </span>
                    </motion.div>
                  )
                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg} index={index}
                      isOwn={msg.username === username}
                      theme={theme} T={T}
                      username={username}
                      seen={typeof msg.id === 'number' && msg.id <= seenByOthers}
                      onReact={(emoji) => reactTo(msg.id, emoji)}
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
                  onReact={(msgId, emoji) => { reactTo(msgId, emoji); setContextMenu(null) }}
                  onClose={() => setContextMenu(null)}
                />

                <TypingIndicator typingUsers={typingUsers} theme={theme} />
                <div ref={bottomRef} />
              </div>

              {/* fix #3: Input field (now always at the bottom of the chat section and above BottomNav) */}
              <div style={{ paddingBottom: isMobile ? '60px' : '0', position: 'relative', zIndex: 2 }}>
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
              onJoinRoom={joinRoom} onSwitchToChat={() => switchTab('chat')}
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
              onReplayTutorial={startTour}
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
              onAvatarChange={handleAvatarChange}
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
            onTabChange={switchTab}
          />
        </div>
      )}

      <Tutorial open={tourOpen} onClose={closeTour} />
      <VideoCall call={call} theme={theme} username={username} avatar={avatar.src} isMobile={isMobile} />

      <PochitaEgg visible={pochitaVisible} hearts={hearts} />
    </motion.div>
  )
}