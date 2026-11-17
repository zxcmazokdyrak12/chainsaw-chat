import { motion } from 'framer-motion'
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
  callCount = 0, inCall = false, onCall,
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
      borderBottom: `4px solid ${T.headerBorder}`,
      boxShadow: T.shadow,
      position: 'relative', zIndex: 10,
      transition: 'background 0.4s',
    }}>
      {/* Top bar */}
      <div style={{
        padding: isMobile ? '6px 10px' : '8px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: isMobile ? 'none' : `2px solid ${T.headerBorder}`, // На мобилке убираем нижнюю рамку топбара, так как табов под ним не будет
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? '16px' : '22px',
            letterSpacing: isMobile ? '1px' : '3px',
            color: T.titleColor,
            textShadow: theme === 'light' ? '3px 3px 0 var(--accent)' : '3px 3px 0 #444',
            whiteSpace: 'nowrap',
          }}>
            CHAINSAW <span style={{ color: T.titleAccent }}>CHAT</span>
          </h1>
          {!isMobile && (
            <span style={{
              fontSize: '13px', color: theme === 'light' ? 'var(--accent)' : '#fff',
              fontFamily: "'AnimeAce', sans-serif", letterSpacing: '1px',
            }}>
              {rooms.find(r => r.id === currentRoom)?.name || ''}
            </span>
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
              {callCount ? `JOIN CALL (${callCount})` : 'CALL'}
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
            {theme === 'light' ? '◑ DARK' : '◐ LIGHT'}
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