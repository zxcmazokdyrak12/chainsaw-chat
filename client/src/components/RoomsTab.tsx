import { motion, AnimatePresence } from 'framer-motion'
import CsmIcon from './CsmIcon'
import { useT } from '../lib/i18n'

// describe the structure of a room object
export interface RoomItem {
  id: string
  name: string
  code: string
  count: number | string
}

// describe the structure of theme tokens used in the RoomsTab component
export interface ThemeTokens {
  headerBorder: string
  titleColor: string
  inputBg: string
  inputBorder: string
  inputColor: string
  shadow: string
}

// describe the structure of props for the RoomsTab component
interface RoomsTabProps {
  rooms: RoomItem[]
  currentRoom: string | null
  theme: 'light' | 'dark' | string
  T: ThemeTokens
  onJoinRoom: (roomId: string) => void
  onSwitchToChat: () => void
  showCreateRoom: boolean
  setShowCreateRoom: (show: boolean) => void
  showJoinByCode: boolean
  setShowJoinByCode: (show: boolean) => void
  newRoomName: string
  setNewRoomName: (name: string) => void
  joinCode: string
  setJoinCode: (code: string) => void
  joinError: string
  setJoinError: (error: string) => void
  createdCode: string
  setCreatedCode: (code: string) => void
  onCreateRoom: () => void
  onJoinByCode: () => void
}

export default function RoomsTab({
  rooms,
  currentRoom,
  theme,
  T,
  onJoinRoom,
  onSwitchToChat,
  showCreateRoom,
  setShowCreateRoom,
  showJoinByCode,
  setShowJoinByCode,
  newRoomName,
  setNewRoomName,
  joinCode,
  setJoinCode,
  joinError,
  setJoinError,
  createdCode,
  setCreatedCode,
  onCreateRoom,
  onJoinByCode
}: RoomsTabProps) {
  const t = useT()
  const ink = 'var(--ink)'
  const panel = (open: boolean) => ({
    flex: '1 1 230px', minWidth: 0,
    padding: '14px 16px',
    backgroundColor: open ? 'var(--ink)' : 'var(--paper)',
    color: open ? 'var(--paper)' : ink,
    border: `3px solid ${ink}`, borderRadius: '12px',
    boxShadow: open ? 'none' : `4px 4px 0 ${ink}`,
    cursor: 'pointer', textAlign: 'left' as const,
    display: 'flex', alignItems: 'center', gap: '12px',
  })
  const field = {
    flex: 1, minWidth: 0, padding: '10px 14px',
    background: 'var(--paper)', border: `3px solid ${ink}`, borderRadius: '12px',
    color: ink, fontSize: '15px', outline: 'none',
    fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '2px', textTransform: 'uppercase' as const,
  }
  const goBtn = {
    padding: '10px 18px', background: 'var(--accent)', color: 'var(--on-accent)',
    border: `3px solid ${ink}`, borderRadius: '12px',
    fontFamily: 'BlambotClassic, sans-serif', fontSize: '15px', letterSpacing: '2px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' as const,
  }

  return (
    <div style={{ flex: 1, padding: '22px 22px 30px', overflowY: 'auto', color: ink, maxWidth: '760px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

      {/* title: like the contents page of a tankōbon */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', marginBottom: '6px' }}>
        <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: 'clamp(30px, 8vw, 40px)', letterSpacing: '6px', lineHeight: 1 }}>{t('CONTENTS')}</div>
        <div style={{ fontFamily: 'serif', fontSize: '18px', opacity: 0.55, paddingBottom: '4px', whiteSpace: 'nowrap' }}>目次</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '11px', letterSpacing: '1px', paddingBottom: '6px', opacity: 0.7, whiteSpace: 'nowrap' }}>
          {rooms.length} {rooms.length === 1 ? t('CHAPTER') : t('CHAPTERS')}
        </div>
      </div>
      <div style={{ height: '4px', background: ink, marginBottom: '3px' }} />
      <div style={{ height: '1.5px', background: ink, marginBottom: '20px' }} />

      {/* freshly created room: a ticket stub with the invite code */}
      <AnimatePresence>
        {createdCode && (
          <motion.div
            initial={{ opacity: 0, y: -10, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex', alignItems: 'stretch', marginBottom: '22px',
              border: `3px solid ${ink}`, borderRadius: '12px', overflow: 'hidden',
              boxShadow: `4px 4px 0 ${ink}`, backgroundColor: 'var(--paper)',
            }}
          >
            <div className="tone" style={{ width: '38px', borderRight: `3px dashed ${ink}`, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '12px 16px' }}>
              <div style={{ fontSize: '10px', fontFamily: "'AnimeAce', sans-serif", letterSpacing: '1px', opacity: 0.7, marginBottom: '2px' }}>
                NEW CHAPTER OPEN — SHARE THE CODE
              </div>
              <div style={{ fontSize: '32px', letterSpacing: '8px', fontFamily: 'BlambotClassic, sans-serif' }}>{createdCode}</div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(createdCode) }}
              style={{ ...goBtn, borderRadius: 0, border: 'none', borderLeft: `3px solid ${ink}` }}
            >
              <CsmIcon name="copy" size={17} /> COPY
            </button>
            <button
              onClick={() => setCreatedCode('')}
              aria-label="Close"
              style={{ background: 'transparent', border: 'none', borderLeft: `3px solid ${ink}`, borderRadius: 0, color: ink, cursor: 'pointer', padding: '0 14px', fontSize: '18px' }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* two big panels: start a chapter / step into one by code */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setShowCreateRoom(!showCreateRoom); setShowJoinByCode(false) }}
          style={panel(showCreateRoom)}
        >
          <CsmIcon name="plus" size={30} strokeWidth={2.6} />
          <span>
            <span style={{ display: 'block', fontFamily: 'BlambotClassic, sans-serif', fontSize: '20px', letterSpacing: '2px' }}>{t('NEW CHAPTER')}</span>
            <span style={{ display: 'block', fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', opacity: 0.7 }}>{t('start a room, get an invite code')}</span>
          </span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setShowJoinByCode(!showJoinByCode); setShowCreateRoom(false) }}
          style={panel(showJoinByCode)}
        >
          <CsmIcon name="key" size={30} strokeWidth={2.6} />
          <span>
            <span style={{ display: 'block', fontFamily: 'BlambotClassic, sans-serif', fontSize: '20px', letterSpacing: '2px' }}>{t('ENTER BY CODE')}</span>
            <span style={{ display: 'block', fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', opacity: 0.7 }}>{t('a friend sent you a code')}</span>
          </span>
        </motion.button>
      </div>

      <AnimatePresence>
        {showCreateRoom && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '10px', paddingTop: '2px' }}>
              <input
                style={field}
                placeholder={t('CHAPTER TITLE (OPTIONAL)')}
                maxLength={16}
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onCreateRoom()}
              />
              <motion.button whileTap={{ scale: 0.95 }} onClick={onCreateRoom} style={goBtn}>
                <CsmIcon name="chainsaw" size={18} /> {t('CREATE')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJoinByCode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', paddingTop: '2px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  style={{ ...field, minWidth: 0, letterSpacing: '3px', textAlign: 'center', fontSize: '17px', borderStyle: joinError ? 'dashed' : 'solid' }}
                  placeholder="KAIRYU4821"
                  // codes are 10 chars now (older rooms: 8); the server takes 4–16
                  maxLength={16}
                  autoCapitalize="characters" autoComplete="off" spellCheck={false}
                  value={joinCode}
                  // pasted "kairyu 4821" or "#KAIRYU4821" still works
                  onChange={e => { setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setJoinError('') }}
                  onKeyDown={e => e.key === 'Enter' && onJoinByCode()}
                />
                <motion.button whileTap={{ scale: 0.95 }} onClick={onJoinByCode} style={goBtn}>
                  <CsmIcon name="door" size={18} /> {t('ENTER')}
                </motion.button>
              </div>
              {joinError && (
                <span style={{ fontSize: '12px', fontFamily: "'AnimeAce', sans-serif", letterSpacing: '1px' }}>
                  ✕ {joinError}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the contents list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
        {rooms.map((room, i) => {
          const here = currentRoom === room.id
          return (
            <motion.button
              key={room.id}
              whileTap={{ scale: 0.985 }}
              onClick={() => { onJoinRoom(room.id); onSwitchToChat() }}
              className={here ? 'tone-light toc-row' : 'toc-row'}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px 48px 12px 12px',
                backgroundColor: 'var(--paper)',
                border: `3px solid ${ink}`, borderRadius: '12px',
                color: ink, cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{
                fontFamily: 'BlambotClassic, sans-serif', fontSize: 'clamp(26px, 7vw, 34px)', lineHeight: 1,
                letterSpacing: '1px', minWidth: '48px',
                backgroundColor: 'var(--paper)', padding: '0 4px', borderRadius: '6px',
              }}>
                <span style={{ fontSize: '12px', letterSpacing: '2px', display: 'block', opacity: 0.6 }}>CH.</span>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'BlambotClassic, sans-serif', fontSize: 'clamp(16px, 4.5vw, 20px)', letterSpacing: '1.5px',
                    overflowWrap: 'anywhere', minWidth: 0,
                    backgroundColor: 'var(--paper)', padding: '0 4px', borderRadius: '4px',
                  }}>
                    {room.name}
                  </span>
                  {/* dotted leader to the page count */}
                  <span style={{ flex: 1, borderBottom: `3px dotted ${ink}`, minWidth: '20px', transform: 'translateY(-4px)' }} />
                  <span style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '12px', whiteSpace: 'nowrap', backgroundColor: 'var(--paper)', padding: '0 4px', borderRadius: '4px' }}>
                    {room.count} p.
                  </span>
                </span>
                <span style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'BlambotClassic, sans-serif', fontSize: '11px', letterSpacing: '3px',
                    border: `2px solid ${ink}`, borderRadius: '4px', padding: '0 6px',
                    backgroundColor: 'var(--paper)', transform: 'rotate(-2deg)',
                  }}>
                    {t('CODE')} {room.code}
                  </span>
                  {here && (
                    <span style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', backgroundColor: 'var(--paper)', padding: '0 4px', borderRadius: '4px' }}>
                      ◀ {t('you are reading this')}
                    </span>
                  )}
                </span>
              </span>

              {/* bookmark ribbon on the chapter you're in */}
              {here && (
                <svg viewBox="0 0 24 40" aria-hidden style={{ position: 'absolute', right: '16px', top: '-3px', width: '24px', height: '40px' }}>
                  <path d="M2 0h20v38l-10-8-10 8z" fill="var(--ink)" />
                </svg>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
