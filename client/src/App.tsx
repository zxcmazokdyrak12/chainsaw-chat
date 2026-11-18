import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import IntroScreen, { SlashOverlay } from './components/IntroScreen'
import UsernameScreen, { AVATARS } from './components/UsernameScreen'
import Header from './components/Header'
import { ChapterRail, ChapterDrawer } from './components/ChapterDrawer'
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
import SfxLayer from './components/SfxLayer'
import CharacterModal from './components/CharacterModal'
import { API_URL } from './config'
import { socket, connectSocket } from './lib/socket'
import { getToken, getAccountToken, setAccountToken, setGuestToken, clearTokens } from './lib/auth'
import { CHAINSAW_SFX, playSound as playSfx, isShout } from './lib/sound'
import { useTheme } from './theme'
import type { MessageItem, RoomItem, AvatarItem, ContextMenuState, GroupedItem } from './chatTypes'
import { useVoiceRecorder } from './hooks/useVoiceRecorder'
import { useSfx } from './hooks/useSfx'
import { usePochita } from './hooks/usePochita'
import { useTabs } from './hooks/useTabs'
import { useChapterNav } from './hooks/useChapterNav'
import { useTour } from './hooks/useTour'
import { useRejoinOnReconnect } from './hooks/useRejoinOnReconnect'

// types used to live here — re-exported so older imports keep working
export type { MessageItem, RoomItem, AvatarItem, ContextMenuState } from './chatTypes'
export type { ThemeTokens } from './theme'

export default function App() {
  const [phase, setPhase]                   = useState<'intro' | 'slashing' | 'username' | 'chat' | string>('intro')
  const [username, setUsername]             = useState<string>('')
  const [usernameInput, setUsernameInput]   = useState<string>('')
  const [messages, setMessages]             = useState<MessageItem[]>([])
  const [input, setInput]                   = useState<string>('')
  const { activeTab, setActiveTab, toneCut, switchTab } = useTabs('chat')
  const [currentRoom, setCurrentRoom]       = useState<string>('general')
  const [rooms, setRooms]                   = useState<RoomItem[]>([])
  const [typingUsers, setTypingUsers]       = useState<string[]>([])
  
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const [showCreateRoom, setShowCreateRoom] = useState<boolean>(false)
  const [showJoinByCode, setShowJoinByCode] = useState<boolean>(false)
  const [newRoomName, setNewRoomName]       = useState<string>('')
  const [joinCode, setJoinCode]             = useState<string>('')
  const [joinError, setJoinError]           = useState<string>('')
  const [createdCode, setCreatedCode]       = useState<string>('')
  const { isMobile } = useWindowSize()
  
  const [avatar, setAvatar] = useState<AvatarItem>(AVATARS[0] as AvatarItem)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [pinnedMsg, setPinnedMsg] = useState<MessageItem | null>(null)

  const [authError, setAuthError]     = useState<string>('')
  const [authLoading, setAuthLoading] = useState<boolean>(false)
  // username → id of the last message they've seen in the current room
  const [seenMarks, setSeenMarks] = useState<Record<string, number>>({})
  const lastMarked = useRef<number>(0)

  const call = useVideoCall(socket, currentRoom, username)
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder(currentRoom, username, avatar.src)
  const { railOpen, toggleRail, drawerOpen, setDrawerOpen } = useChapterNav()
  const { tourOpen, startTour, closeTour } = useTour(phase === 'chat', () => setActiveTab('chat'))
  // whose character page is open (tap on an avatar in the chat)
  const [viewUser, setViewUser] = useState<{ name: string; avatar?: string } | null>(null)

  const { settings, update: updateSetting, resolveTheme } = useSettings()
  const { theme, T } = useTheme(settings.theme, resolveTheme)
  const { sfx, popSfx } = useSfx(settings.sfxEnabled ?? true)
  const { pochitaVisible, hearts, triggerPochita } = usePochita(settings.pochitaEnabled ?? true)
  const meRef = useRef<string>('')
  meRef.current = username

  const playSound = (src: string, volume: number = 0.4): void => {
    if (settings.soundEnabled) playSfx(src, volume)
  }


  useEffect(() => {
    // OAuth comes back with #token=… (a fragment never reaches servers or logs); ?token= is the old form
    const fromHash = new URLSearchParams(window.location.hash.slice(1)).get('token')
    const fromQuery = new URLSearchParams(window.location.search).get('token')
    const incoming = fromHash || fromQuery
    if (incoming) {
      setAccountToken(incoming)
      window.history.replaceState({}, '', '/')
    }
    const saved = getToken()
    if (saved) {
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${saved}` }
      })
        .then(r => (r.status === 401 ? null : r.json()))
        .then(user => {
          if (user?.username) enterChat(user)
          else if (user === null) clearTokens()
        })
        .catch(() => { /* server asleep — keep the token, try again on reload */ })
    }
  }, [])

  // the server dropped our token (expired, secret rotated) → back to the login page
  useEffect(() => {
    const onErr = (err: Error) => {
      if (err.message !== 'unauthorized') return
      clearTokens()
      setPhase('username')
      setAuthError('Session expired — sign in again')
    }
    socket.on('connect_error', onErr)
    return () => { socket.off('connect_error', onErr) }
  }, [])

  // shared entry point for OAuth tokens and login/password accounts
  const enterChat = (user: { username: string; avatar?: string | null }, fallback: AvatarItem = AVATARS[0] as AvatarItem): void => {
    const chosen: AvatarItem = user.avatar
      ? { id: 'account', name: user.username, src: user.avatar }
      : fallback
    setUsername(user.username)
    setAvatar(chosen)
    setPhase('chat')
    connectSocket()
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
      setAccountToken(data.token)
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
    const token = getAccountToken()
    if (!token) return
    fetch(`${API_URL}/auth/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ avatar: newAv.src }),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.token) setAccountToken(data.token) })
      .catch(() => {})
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
      const own = msg.username === meRef.current
      if (isShout(msg.content || '')) popSfx('shout', own)
      else if (own) popSfx('send', true)
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
      popSfx('join', false)
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

  useRejoinOnReconnect({ phase, username, currentRoom, avatarSrc: avatar.src })

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

  // guests get a signed name from the server (it refuses account names and names in use right now)
  const handleSetUsername = async (): Promise<string | null> => {
    const name = usernameInput.trim().toUpperCase()
    if (name.length < 2) return 'Write at least 2 letters on the line first'
    try {
      const res = await fetch(`${API_URL}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, avatar: avatar.src }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.token) return data.error || (res.status === 429 ? 'Too many tries, wait a bit' : 'Server error')
      setGuestToken(data.token)
      setUsername(data.user.username)
      setPhase('chat')
      connectSocket()
      socket.emit('get_rooms', { username: data.user.username })
      socket.emit('join_room', { roomId: 'general', username: data.user.username, avatar: avatar.src })
      return null
    } catch {
      return 'Server is sleeping, try again'
    }
  }

  // chapter 0: the intro roars, then the cut plays over the login page
  const [slashing, setSlashing] = useState<boolean>(false)
  const finishIntro = (): void => { setPhase('username'); setSlashing(true) }


  const sendMessage = (): void => {
    if (!input.trim()) return
    if (isShout(input.trim()) && Math.random() < 0.1) {
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


  const createRoom = (): void => {
    socket.emit('create_room', { username, roomName: newRoomName })
  }

  const joinByCode = (): void => {
    if (joinCode.trim().length < 6) return
    socket.emit('join_by_code', { code: joinCode.trim(), username })
  }

  const handleLogout = (): void => {
    call.leave()
    clearTokens()
    socket.disconnect()
    window.location.href = '/'
  }

  if (phase === 'intro' || phase === 'slashing') {
    return <IntroScreen soundOn={settings.soundEnabled} onRoar={() => playSound(CHAINSAW_SFX, 0.5)} onDone={finishIntro} />
  }

  if (phase === 'username') {
    return (
      <>
      {slashing && <SlashOverlay onEnd={() => setSlashing(false)} />}
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
      </>
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
        // the page: panels separated by white gutters, like a manga spread
        padding: isMobile ? '6px' : '10px',
        gap: isMobile ? '6px' : '10px',
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
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: isMobile ? '6px' : '10px' }}>
            {/* chapters rail (desktop); on mobile it's a drawer inside the feed panel */}
            {!isMobile && (
              <ChapterRail
                rooms={rooms} currentRoom={currentRoom} onPick={joinRoom}
                open={railOpen} onToggle={toggleRail}
                panelStyle={{ border: `4px solid ${T.headerBorder}`, borderRadius: '4px', overflow: 'hidden', background: T.appBg }}
              />
            )}
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: isMobile ? '6px' : '10px' }}>
            {/* feed panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', border: `4px solid ${T.headerBorder}`, borderRadius: '4px', overflow: 'hidden', background: T.appBg }}>
              <SfxLayer bursts={sfx} />
              {isMobile && (
                <ChapterDrawer
                  rooms={rooms} currentRoom={currentRoom} onPick={joinRoom}
                  open={drawerOpen} setOpen={setDrawerOpen}
                />
              )}
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
                  padding: isMobile ? '54px 16px 12px' : '16px 24px', 
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
                      onAvatarClick={(name, av) => setViewUser({ name, avatar: av })}
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
            </div>
              {/* input panel */}
              <div style={{ marginBottom: isMobile ? '62px' : '0', position: 'relative', zIndex: 2, border: `4px solid ${T.headerBorder}`, borderRadius: '4px', overflow: 'hidden', background: T.appBg }}>
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
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: isMobile ? '62px' : '0', border: `4px solid ${T.headerBorder}`, borderRadius: '4px', background: T.appBg }}>
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
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: isMobile ? '62px' : '0', border: `4px solid ${T.headerBorder}`, borderRadius: '4px', background: T.appBg }}>
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
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: isMobile ? '62px' : '0', border: `4px solid ${T.headerBorder}`, borderRadius: '4px', background: T.appBg }}>
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
      <CharacterModal username={viewUser?.name ?? null} fallbackAvatar={viewUser?.avatar ?? null} onClose={() => setViewUser(null)} />
      <VideoCall call={call} theme={theme} username={username} avatar={avatar.src} isMobile={isMobile} />

      <PochitaEgg visible={pochitaVisible} hearts={hearts} />
    </motion.div>
  )
}
