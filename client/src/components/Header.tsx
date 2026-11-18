import { motion } from 'framer-motion'
import CsmIcon from './CsmIcon'
import { useWindowSize } from '../hooks/useWindowSize'

export interface HeaderThemeTokens {
  headerBg: string
  headerBorder: string
  shadow: string
  titleColor: string
  titleAccent: string
  nameColor: string
}

export interface HeaderRoomItem {
  id: string
  name: string
}

interface HeaderProps {
  T: HeaderThemeTokens
  theme: 'light' | 'dark' | string
  username: string
  rooms: HeaderRoomItem[]
  currentRoom: string | null
  activeTab: string
  onTabChange: (tabId: string) => void
  onThemeToggle: () => void
  callCount?: number
  inCall?: boolean
  onCall?: () => void
  onSearch?: () => void
  onExport?: () => void
  onRoomInfo?: () => void
}

interface TabItem {
  id: string
  icon: string
  label: string
  img: string
}

export default function Header({
  T, theme, username, rooms, currentRoom,
  activeTab, onTabChange, onThemeToggle,
  callCount = 0, inCall = false, onCall, onSearch, onExport, onRoomInfo,
}: HeaderProps) {
  const { isMobile } = useWindowSize()

  const tabs: TabItem[] = [
    { id: 'chat',     icon: '/icon_chat.png',     label: 'CHATS',    img: ''  },
    { id: 'rooms',    icon: '/icon_rooms.png',    label: 'ROOMS',    img: ''    },
    { id: 'settings', icon: '/icon_settings.png', label: 'SETTINGS', img: '' },
    { id: 'profile',  icon: '/icon_profile.png',  label: 'PROFILE',  img: ''   },
  ]

  return (
    <div style={{
      background: T.headerBg,
      border: `4px solid ${T.headerBorder}`,
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative', zIndex: 10,
      transition: 'background 0.4s',
    }}>
      {/* Top bar */}
      <div style={{
        padding: isMobile ? '6px 10px' : '8px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: isMobile ? 'none' : `2px solid ${T.headerBorder}`, // На мобилке убираем нижнюю рамку топбара, так как табов под ним не будет
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? '15px' : '22px',
            minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: isMobile ? '1px' : '3px',
            color: T.titleColor,
            textShadow: 'none',
            whiteSpace: 'nowrap',
          }}>
            CHAINSAW <span style={{ color: T.titleAccent }}>CHAT</span>
          </h1>
          {!isMobile && (
            // the room reads as a chapter of the story
            <button onClick={onRoomInfo} title="Room: cast, code, settings (Alt+I)" style={{
              fontSize: '12px', color: T.titleColor, background: 'transparent', cursor: onRoomInfo ? 'pointer' : 'default',
              fontFamily: "'AnimeAce', sans-serif", letterSpacing: '1px',
              border: `3px solid ${T.headerBorder}`, padding: '3px 10px',
              whiteSpace: 'nowrap',
            }}>
              {(() => {
                const i = rooms.findIndex(r => r.id === currentRoom)
                return i >= 0 ? `CHAPTER ${i + 1} — ${rooms[i]?.name ?? ''}` : ''
              })()}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px' }}>
          {!isMobile && (
            <span style={{
              fontSize: '11px', color: T.nameColor,
              letterSpacing: '2px', fontFamily: "'AnimeAce', sans-serif",
            }}>
              {username}
            </span>
          )}
          {onExport && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onExport}
              title="Save the chapter as a manga page (Alt+E)"
              aria-label="Save the chapter as a manga page"
              style={{
                background: 'transparent', color: T.titleColor, border: `2px solid ${T.headerBorder}`,
                padding: isMobile ? '2px 5px' : '3px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                clipPath: 'polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)',
              }}
            >
              <CsmIcon name="page" size={isMobile ? 15 : 17} />
            </motion.button>
          )}
          {onSearch && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSearch}
              title="Search this room (Ctrl+K)"
              aria-label="Search messages"
              style={{
                background: 'transparent', color: T.titleColor, border: `2px solid ${T.headerBorder}`,
                padding: isMobile ? '2px 5px' : '3px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                clipPath: 'polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)',
              }}
            >
              <CsmIcon name="search" size={isMobile ? 15 : 17} />
            </motion.button>
          )}
          {onCall && !inCall && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ skewX: -5 }}
              onClick={onCall}
              data-tour="call"
              title={callCount ? 'Join the video call' : 'Start a video call in this room'}
              animate={callCount ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={callCount ? { repeat: Infinity, duration: 1.2 } : {}}
              style={{
                background: 'var(--accent)', color: 'var(--on-accent)',
                border: `2px solid ${T.headerBorder}`,
                padding: isMobile ? '3px 7px' : '4px 10px',
                fontSize: isMobile ? '10px' : '12px',
                fontFamily: 'BlambotClassic, sans-serif',
                letterSpacing: '1px', cursor: 'pointer',
                clipPath: 'polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)',
                whiteSpace: 'nowrap',
              }}
            >
              {callCount > 0 && (
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--blood)', marginRight: '6px', verticalAlign: '1px' }} />
              )}
              {callCount ? (isMobile ? `JOIN (${callCount})` : `JOIN CALL (${callCount})`) : 'CALL'}
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onThemeToggle}
            data-tour="theme"
            style={{
              background: theme === 'light' ? '#111' : '#fff',
              color: theme === 'light' ? '#fff' : '#111',
              border: `2px solid ${T.headerBorder}`,
              padding: isMobile ? '3px 7px' : '4px 10px',
              fontSize: isMobile ? '10px' : '12px',
              fontFamily: 'BlambotClassic, sans-serif',
              letterSpacing: '1px', cursor: 'pointer',
              clipPath: 'polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <CsmIcon name={theme === 'light' ? 'moon' : 'sun'} size={isMobile ? 15 : 14} strokeWidth={2.4} />
              {!isMobile && (theme === 'light' ? 'NEGATIVE' : 'PAPER')}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Tabs — hidden on mobile, shown on desktop. Manga style: ink frames,
          the active one is filled with screentone and its label sits on a paper pill */}
      {!isMobile && (
        <div style={{
          display: 'flex',
          borderTop: `3px solid ${T.headerBorder}`,
          background: T.headerBg,
        }}>
          {tabs.map((tab, i) => {
            const on = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                data-tour={`tab-${tab.id}`}
                className={on ? 'tone manga-tab' : 'manga-tab'}
                style={{
                  flex: 1, cursor: 'pointer',
                  padding: '9px 8px',
                  backgroundColor: T.headerBg,
                  border: 'none',
                  borderRight: i < tabs.length - 1 ? `3px solid ${T.headerBorder}` : 'none',
                  borderRadius: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  fontFamily: 'BlambotClassic, sans-serif',
                  fontSize: '15px', letterSpacing: '2px',
                  color: T.titleColor,
                  background: on ? T.headerBg : 'transparent',
                  border: on ? `3px solid ${T.headerBorder}` : '3px solid transparent',
                  borderRadius: '999px',
                  padding: '2px 12px',
                }}>
                  <img
                    src={tab.icon} alt=""
                    style={{
                      width: '18px', height: '18px', objectFit: 'contain',
                      filter: theme === 'light' ? 'none' : 'invert(1)',
                    }}
                  />
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}