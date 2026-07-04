import { motion } from 'framer-motion'

interface Tab {
  id: string
  icon: string
  label: string
}

interface BottomNavProps {
  activeTab: string
  theme: string
  T: Record<string, string>
  onTabChange: (id: string) => void
}

const TABS: Tab[] = [
  { id: 'chat',     icon: '/icon_chat.png',     label: 'CHATS'    },
  { id: 'rooms',    icon: '/icon_rooms.png',    label: 'ROOMS'    },
  { id: 'settings', icon: '/icon_settings.png', label: 'SETTINGS' },
  { id: 'profile',  icon: '/icon_profile.png',  label: 'PROFILE'  },
]

export default function BottomNav({ activeTab, theme, T, onTabChange }: BottomNavProps) {
  const bg     = T.headerBg
  const border = T.headerBorder

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: bg,
      borderTop: `3px solid ${border}`,
      display: 'flex', justifyContent: 'space-around',
      alignItems: 'center',
      padding: '6px 0 max(6px, env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.85 }}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              background: 'transparent', border: 'none',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '3px',
              padding: '4px 0',
              borderTop: isActive
                ? `3px solid #cc2200`
                : '3px solid transparent',
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: isActive
                ? (theme === 'light' ? '#111' : '#fff')
                : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}>
              <img
                src={tab.icon}
                style={{
                  width: '20px', height: '20px', objectFit: 'contain',
                  filter: isActive
                    ? (theme === 'light' ? 'invert(1)' : 'invert(0)')
                    : (theme === 'light' ? 'invert(0) opacity(0.4)' : 'invert(1) opacity(0.4)'),
                  transition: 'filter 0.2s',
                }}
              />
            </div>
            <span style={{
              fontFamily: 'BlambotClassic, sans-serif',
              fontSize: '8px', letterSpacing: '0.5px',
              color: isActive
                ? '#cc2200'
                : (theme === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'),
              transition: 'color 0.2s',
            }}>
              {tab.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
