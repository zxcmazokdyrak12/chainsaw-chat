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
}

interface TabItem {
  id: string
  icon: string
  label: string
  img: string
}

export default function Header({
  T, theme, username, rooms, currentRoom,
  activeTab, onTabChange, onThemeToggle
}: HeaderProps) {
  const { isMobile } = useWindowSize()

  const tabs: TabItem[] = [
    { id: 'chat',     icon: '/icon_chat.png',     label: 'CHATS',    img: '/denji.png'  },
    { id: 'rooms',    icon: '/icon_rooms.png',    label: 'ROOMS',    img: '/aki.png'    },
    { id: 'settings', icon: '/icon_settings.png', label: 'SETTINGS', img: '/makima.png' },
    { id: 'profile',  icon: '/icon_profile.png',  label: 'PROFILE',  img: '/reze.png'   },
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
            textShadow: theme === 'light' ? '3px 3px 0 #cc2200' : '3px 3px 0 #444',
            whiteSpace: 'nowrap',
          }}>
            CHAINSAW <span style={{ color: T.titleAccent }}>CHAT</span>
          </h1>
          {!isMobile && (
            <span style={{
              fontSize: '13px', color: theme === 'light' ? '#cc2200' : '#fff',
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
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onThemeToggle}
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

      {/* Tabs — hidden on mobile, shown on desktop */}
      {!isMobile && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: T.headerBg,
          padding: '0 8px 8px',
        }}>
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ y: -12, transition: { type: 'spring', stiffness: 500, damping: 12 } }}
              whileHover={{ y: -4 }}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '4px 12px 0',
                minWidth: '72px',
                position: 'relative',
                borderBottom: activeTab === tab.id
                  ? `4px solid ${theme === 'light' ? '#cc2200' : '#fff'}`
                  : '4px solid transparent',
              }}
            >
              <div style={{ position: 'relative', marginTop: '8px' }}>
                {/* Floating character above tab */}
                <motion.img
                  src={tab.img}
                  animate={activeTab === tab.id
                    ? { y: 0, opacity: 1, scale: 1 }
                    : { y: 14, opacity: 0.25, scale: 0.7 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    position: 'absolute', top: '-42px', left: '50%',
                    transform: 'translateX(-50%)',
                    height: '52px', objectFit: 'contain',
                    pointerEvents: 'none', zIndex: 3,
                    filter: activeTab === tab.id ? 'none' : 'grayscale(80%)',
                    transition: 'filter 0.2s',
                  }}
                />

                {/* Icon circle */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: activeTab === tab.id
                    ? (theme === 'light' ? '#111' : '#fff')
                    : (theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: activeTab === tab.id
                    ? `3px solid ${theme === 'light' ? '#cc2200' : '#fff'}`
                    : `2px solid ${theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}`,
                  transition: 'all 0.2s',
                  position: 'relative', zIndex: 2, overflow: 'hidden',
                }}>
                  <img
                    src={tab.icon}
                    style={{
                      width: '28px',
                      height: '28px',
                      objectFit: 'contain',
                      filter: activeTab === tab.id
                        ? (theme === 'light' ? 'invert(1)' : 'invert(0)')
                        : (theme === 'light' ? 'invert(0)' : 'invert(1)'),
                      transition: 'filter 0.2s',
                    }}
                  />
                </div>
              </div>

              <span style={{
                fontFamily: 'BlambotClassic, sans-serif',
                fontSize: '10px',
                letterSpacing: '2px',
                color: activeTab === tab.id
                  ? (theme === 'light' ? '#cc2200' : '#fff')
                  : (theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'),
                marginTop: '4px', marginBottom: '2px',
                transition: 'color 0.2s',
              }}>
                {tab.label}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}