
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
      padding: '0 0 env(safe-area-inset-bottom)',
      minHeight: '58px',
      zIndex: 100,
    }}>
      {TABS.map((tab, i) => {
        const isActive = activeTab === tab.id
        const ink = border
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            data-tour={`tab-${tab.id}`}
            className={isActive ? 'tone manga-tab' : 'manga-tab'}
            style={{
              flex: 1, alignSelf: 'stretch',
              backgroundColor: bg,
              border: 'none',
              borderRight: i < TABS.length - 1 ? `3px solid ${ink}` : 'none',
              borderRadius: 0,
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              padding: '6px 0',
            }}
          >
            <span style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              background: isActive ? bg : 'transparent',
              border: isActive ? `2px solid ${ink}` : '2px solid transparent',
              borderRadius: '12px',
              padding: '3px 8px',
            }}>
              <img
                src={tab.icon} alt=""
                style={{
                  width: '20px', height: '20px', objectFit: 'contain',
                  filter: theme === 'light' ? 'none' : 'invert(1)',
                  opacity: isActive ? 1 : 0.55,
                }}
              />
              <span style={{
                fontFamily: 'BlambotClassic, sans-serif',
                fontSize: '9px', letterSpacing: '1px',
                color: T.titleColor,
                opacity: isActive ? 1 : 0.55,
              }}>
                {tab.label}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
