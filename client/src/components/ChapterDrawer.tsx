import type { CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useT } from '../lib/i18n'
import CsmIcon from './CsmIcon'

// Chapters (rooms) panel that slides in and out.
// Desktop: a rail that collapses to a thin strip of chapter numbers.
// Mobile: a pull tab on the feed's left edge opens a drawer over the feed.

export interface ChapterItem {
  id: string
  name: string
  count: number | string
}

interface ListProps {
  rooms: ChapterItem[]
  currentRoom: string | null
  onPick: (roomId: string) => void
}

const ink = 'var(--ink)'
const paper = 'var(--paper)'

function ChapterList({ rooms, currentRoom, onPick }: ListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', overflowY: 'auto', flex: 1 }}>
      {rooms.map((room, i) => {
        const here = room.id === currentRoom
        return (
          <motion.button
            key={room.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPick(room.id)}
            className={here ? undefined : 'toc-row'}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', textAlign: 'left', cursor: 'pointer',
              backgroundColor: here ? ink : paper, color: here ? paper : ink,
              border: `2.5px solid ${ink}`, borderRadius: '10px',
            }}
          >
            <span style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '22px', lineHeight: 1, minWidth: '26px' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: 'BlambotClassic, sans-serif', fontSize: '14px', letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {room.name}
              </span>
              <span style={{ display: 'block', fontFamily: "'AnimeAce', sans-serif", fontSize: '9px', opacity: 0.65 }}>
                {room.count} p.
              </span>
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

function Head({ onToggle, open }: { onToggle: () => void; open: boolean }) {
  const t = useT()
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 8px 8px 12px', borderBottom: `3px solid ${ink}`, color: ink,
    }}>
      <CsmIcon name="chapters" size={18} strokeWidth={2.3} />
      <span style={{ flex: 1, fontFamily: 'BlambotClassic, sans-serif', fontSize: '15px', letterSpacing: '2px' }}>{t('CHAPTERS_TITLE')}</span>
      <button
        onClick={onToggle}
        aria-label={open ? 'Hide chapters' : 'Show chapters'}
        style={{
          width: '28px', height: '28px', padding: 0,
          border: `2.5px solid ${ink}`, borderRadius: '50%',
          backgroundColor: paper, color: ink, cursor: 'pointer',
          fontFamily: 'BlambotClassic, sans-serif', fontSize: '16px', lineHeight: 1,
        }}
      >
        ‹
      </button>
    </div>
  )
}

// ── desktop rail ─────────────────────────────────────────────────

interface RailProps extends ListProps {
  open: boolean
  onToggle: () => void
  panelStyle: CSSProperties
}

export function ChapterRail({ rooms, currentRoom, onPick, open, onToggle, panelStyle }: RailProps) {
  const t = useT()
  return (
    <motion.div
      data-tour="rooms"
      initial={false}
      animate={{ width: open ? 230 : 56 }}
      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
      style={{ ...panelStyle, display: 'flex', flexDirection: 'column', flexShrink: 0, width: open ? 230 : 56 }}
    >
      {open ? (
        <>
          <Head open onToggle={onToggle} />
          <ChapterList rooms={rooms} currentRoom={currentRoom} onPick={onPick} />
        </>
      ) : (
        // collapsed: a strip with the pull handle and quick-jump chapter numbers
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '8px 0', height: '100%', color: ink }}>
          <button
            onClick={onToggle}
            aria-label="Show chapters"
            title="Show chapters"
            style={{
              width: '38px', height: '38px', padding: 0,
              border: `2.5px solid ${ink}`, borderRadius: '10px',
              backgroundColor: ink, color: paper, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <CsmIcon name="chapters" size={20} strokeWidth={2.3} />
          </button>
          <div style={{ width: '60%', height: '3px', background: ink }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', alignItems: 'center' }}>
            {rooms.map((room, i) => {
              const here = room.id === currentRoom
              return (
                <button
                  key={room.id}
                  onClick={() => onPick(room.id)}
                  title={room.name}
                  aria-label={`Chapter ${i + 1}: ${room.name}`}
                  style={{
                    width: '34px', height: '34px', padding: 0, borderRadius: '50%',
                    border: `2.5px solid ${ink}`,
                    backgroundColor: here ? ink : paper, color: here ? paper : ink,
                    fontFamily: 'BlambotClassic, sans-serif', fontSize: '15px', cursor: 'pointer',
                  }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div style={{ flex: 1 }} />
          <span style={{
            writingMode: 'vertical-rl', transform: 'rotate(180deg)',
            fontFamily: 'BlambotClassic, sans-serif', fontSize: '13px', letterSpacing: '4px', opacity: 0.7,
            paddingBottom: '4px',
          }}>
            {t('CHAPTERS_TITLE')}
          </span>
        </div>
      )}
    </motion.div>
  )
}

// ── mobile drawer ────────────────────────────────────────────────

interface DrawerProps extends ListProps {
  open: boolean
  setOpen: (v: boolean) => void
}

export function ChapterDrawer({ rooms, currentRoom, onPick, open, setOpen }: DrawerProps) {
  const idx = rooms.findIndex(r => r.id === currentRoom)
  return (
    <>
      {/* pull tab sticking out of the feed's left edge */}
      <motion.button
        whileTap={{ x: 4 }}
        onClick={() => setOpen(true)}
        data-tour="rooms"
        aria-label="Open chapters"
        style={{
          position: 'absolute', left: '-3px', top: '12px', zIndex: 4,
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 10px 7px 8px',
          backgroundColor: ink, color: paper,
          border: `3px solid ${ink}`, borderRadius: '0 12px 12px 0',
          fontFamily: 'BlambotClassic, sans-serif', fontSize: '13px', letterSpacing: '1px',
          cursor: 'pointer',
        }}
      >
        <CsmIcon name="chapters" size={16} strokeWidth={2.3} />
        CH.{idx >= 0 ? String(idx + 1).padStart(2, '0') : '--'} ›
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="shade"
              className="tone"
              initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'absolute', inset: 0, zIndex: 20, backgroundColor: 'transparent' }}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-105%' }} animate={{ x: 0 }} exit={{ x: '-105%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
              style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 21,
                width: 'min(78%, 280px)',
                backgroundColor: paper, borderRight: `4px solid ${ink}`,
                display: 'flex', flexDirection: 'column',
              }}
            >
              <Head open onToggle={() => setOpen(false)} />
              <ChapterList rooms={rooms} currentRoom={currentRoom} onPick={(id) => { onPick(id); setOpen(false) }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
