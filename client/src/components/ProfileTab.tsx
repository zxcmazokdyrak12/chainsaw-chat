import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AVATARS } from './UsernameScreen'
import { useWindowSize } from '../hooks/useWindowSize'
import CsmIcon from './CsmIcon'
import CharacterPage from './CharacterPage'
import { fetchProfile, rankOf, achievementsOf, EMPTY_PAGE, type ProfileData } from '../profileData'

export interface Avatar {
  id: string | number
  name: string
  src: string
}

export interface Room {
  id: string | number
  name: string
}

interface ProfileTabProps {
  avatar: Avatar
  username: string
  rooms: Room[]
  currentRoom: string | number | null
  T: Record<string, string>
  theme: 'light' | 'dark' | 'system'
  onLogout: () => void
  onAvatarChange: (avatar: Avatar) => void
}

function generateId(username: string): string {
  const hash = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return `SDH-${username.slice(0, 4).toUpperCase()}-${String(hash * 37).slice(0, 5)}`
}

// horizontal barcode (for mobile vertical card)
function BarcodeH({ value }: { value: string; dark: boolean }) {
  const fg = 'var(--ink)'
  const seed = value.split('').map(c => c.charCodeAt(0))
  const len = seed.length || 1
  const bars = Array.from({ length: 48 }, (_, i) => ({
    w: (((seed[i % len] ?? 0) * (i + 7)) % 3) + 1,
    h: 30 + (((seed[(i + 2) % len] ?? 0) * (i + 1)) % 30),
    gap: (((seed[(i + 1) % len] ?? 0)) % 2) + 1,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '50px' }}>
        {bars.map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: `${b.gap}px`, marginRight: `${b.gap}px` }}>
            <div style={{ width: `${b.w}px`, height: `${b.h}px`, background: fg, opacity: 0.88 }} />
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '8px', letterSpacing: '2px', color: fg, opacity: 0.45 }}>
        {value}
      </div>
    </div>
  )
}

// Avatar picker — FIXED FOR MOBILE GRID
function AvatarPicker({
  avatar, dark, cardBorder, textMain,
  onPick, onClose,
}: {
  avatar: Avatar
  dark: boolean
  cardBorder: string
  textMain: string
  onPick: (av: Avatar) => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        style={{
          background: dark ? '#111' : '#f0ebe0',
          border: `3px solid ${cardBorder}`,
          boxShadow: '6px 6px 0 var(--accent)',
          padding: '16px', maxWidth: '480px', width: '92%', // adaptive width for mobile
          maxHeight: '75vh', display: 'flex', flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          fontFamily: 'BlambotClassic, sans-serif', fontSize: '13px',
          letterSpacing: '3px', color: textMain,
          marginBottom: '14px', textAlign: 'center',
          borderBottom: '2px solid var(--accent)', paddingBottom: '8px',
          flexShrink: 0
        }}>
          SELECT AGENT
        </div>
        
        {/* adaptive grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', 
          gap: '10px',
          overflowY: 'auto',
          flex: 1,
          paddingRight: '4px'
        }}>
          {(AVATARS as Avatar[]).map(av => (
            <motion.div
              key={av.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
              onClick={() => onPick(av)}
              style={{
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '6px', padding: '6px',
                border: `2px solid ${avatar.id === av.id ? 'var(--accent)' : (dark ? '#333' : '#ccc')}`,
                background: avatar.id === av.id ? 'rgba(17,17,17,0.1)' : 'transparent',
                boxSizing: 'border-box',
                minWidth: 0 // important for text ellipsis in flexbox
              }}
            >
              <img 
                src={av.src} 
                alt={av.name} 
                style={{ 
                  width: '100%', 
                  maxWidth: '64px',
                  aspectRatio: '1/1',
                  objectFit: 'cover', 
                  display: 'block',
                  filter: 'grayscale(1) contrast(1.12)',
                  border: `2px solid ${avatar.id === av.id ? 'var(--accent)' : 'transparent'}` 
                }} 
              />
              <span style={{ 
                fontFamily: "'AnimeAce', sans-serif", 
                fontSize: '9px', 
                color: textMain, 
                textAlign: 'center', 
                lineHeight: 1.1,
                wordBreak: 'break-word',
                overflow: 'hidden'
              }}>
                {av.name.toUpperCase()}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileTap={{ x: 2, y: 2 }} onClick={onClose}
          style={{
            marginTop: '14px', width: '100%', padding: '9px',
            background: dark ? '#fff' : '#111', color: dark ? '#111' : '#fff',
            border: `2px solid ${cardBorder}`, fontFamily: 'BlambotClassic, sans-serif',
            fontSize: '14px', letterSpacing: '3px', cursor: 'pointer',
            boxShadow: '3px 3px 0 var(--accent)',
            flexShrink: 0
          }}
        >
          CANCEL
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── card pieces ──────────────────────────────────────────────────

const INK = 'var(--ink)'
const PAPER = 'var(--paper)'
const label = { fontFamily: "'AnimeAce', sans-serif", fontSize: '8px', letterSpacing: '1px', opacity: 0.6 } as const
const value = { fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '1px', lineHeight: 1.2 } as const

// the Public Safety bureau badge from the original card
function BureauEmblem({ dark, size = 70 }: { dark: boolean; size?: number }) {
  return (
    <div style={{ border: `2px solid ${INK}`, backgroundColor: PAPER, padding: '7px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textAlign: 'center' }}>
      <img src="/emblem.svg" alt="Public Safety emblem" style={{ width: size, height: size, objectFit: 'contain', filter: dark ? 'invert(1)' : 'none' }} />
      <div style={{ ...value, fontSize: '10px', lineHeight: 1.3 }}>PUBLIC SAFETY<br />DEVIL HUNTERS</div>
      <div style={{ fontFamily: 'serif', fontSize: '9px', opacity: 0.6 }}>公安デビルハンター</div>
    </div>
  )
}

// red hanko seal — the one drop of red on the card
function Seal({ style }: { style?: React.CSSProperties }) {
  return (
    <div aria-hidden style={{
      position: 'absolute', width: '58px', height: '58px',
      border: '3px solid var(--blood)', borderRadius: '8px', color: 'var(--blood)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'serif', fontSize: '21px', letterSpacing: '-2px',
      transform: 'rotate(12deg)', opacity: 0.85, pointerEvents: 'none', ...style,
    }}>公安</div>
  )
}

// laminate glare + coffee ring + holo sticker: makes the card feel handled
function Wear() {
  return (
    <>
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.45) 41%, transparent 49%, transparent 63%, rgba(255,255,255,0.3) 69%, transparent 75%)' }} />
      <div aria-hidden style={{ position: 'absolute', left: '-34px', bottom: '-44px', width: '120px', height: '120px', borderRadius: '50%', border: '6px solid rgba(80,70,60,0.14)', borderLeftColor: 'rgba(80,70,60,0.05)', pointerEvents: 'none' }} />
    </>
  )
}

function Strip({ text }: { text: string }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: INK, color: PAPER, padding: '6px 10px', textAlign: 'center' }}>
      <div style={{ ...value, fontSize: '10px', letterSpacing: '3px' }}>{text}</div>
      <div style={{ fontFamily: 'serif', fontSize: '8px', opacity: 0.5, marginTop: '2px', letterSpacing: '1px' }}>もう大丈夫、ここが僕たちの温かい家だよ。</div>
    </div>
  )
}

const faceStyle: React.CSSProperties = {
  position: 'absolute', inset: 0,
  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
  backgroundColor: PAPER, color: INK,
  border: `3px solid ${INK}`, borderRadius: '16px',
  overflow: 'hidden',
  // no filter / clip-path here or on the flipper: both flatten the 3D flip in browsers
  boxShadow: '5px 7px 0 rgba(0,0,0,0.25)',
}

export default function ProfileTab({
  avatar, username, rooms, currentRoom,
  theme, onLogout, onAvatarChange,
}: ProfileTabProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const { isMobile } = useWindowSize()

  useEffect(() => {
    let alive = true
    if (username) fetchProfile(username).then(p => { if (alive) setProfile(p) })
    return () => { alive = false }
  }, [username])

  const dark = theme === 'dark'
  const cardBorder = dark ? '#f2efe6' : '#111'
  const textMain = dark ? '#f2efe6' : '#111'

  const hunterId = generateId(username)
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '')
  const since = profile?.stats.since ? new Date(profile.stats.since) : new Date()
  const issueDate = fmt(since)
  const expDate = fmt(new Date(since.getTime() + 10 * 365 * 86_400_000))
  const roomName = rooms.find(r => r.id === currentRoom)?.name?.replace('#', '').trim() || 'PUBLIC'

  const stats = profile?.stats ?? null
  const rank = rankOf(stats?.lines ?? 0)
  const stamps = stats ? achievementsOf(stats) : []
  const n = (v: number | undefined) => (stats ? (v ?? 0).toLocaleString('ru-RU') : '…')

  const W = isMobile ? 330 : 600
  const H = isMobile ? 560 : 370

  // ── front ──
  const front = (
    <div style={faceStyle}>
      {/* slot for the lanyard */}
      <div className="tone" style={{ width: '58px', height: '12px', border: `3px solid ${INK}`, borderRadius: '8px', margin: '10px auto 0', backgroundColor: PAPER }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 18px 0' }}>
        <div>
          <div style={{ fontFamily: 'serif', fontSize: '13px', letterSpacing: '5px' }}>日本国政府</div>
          <div style={{ ...label, fontSize: '7px', letterSpacing: '3px' }}>GOVERNMENT OF JAPAN</div>
        </div>
        <div style={{ ...value, fontSize: '11px', letterSpacing: '2px', opacity: 0.7 }}>PUBLIC SAFETY</div>
      </div>
      <div style={{ height: '2px', background: INK, margin: '6px 18px 12px' }} />

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '14px', padding: '0 18px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          {/* photo + change button + seal */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: isMobile ? '130px' : '140px', height: isMobile ? '165px' : '175px', border: `3px solid ${INK}`, overflow: 'hidden' }}>
              <img src={avatar.src} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(1) contrast(1.12)' }} />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowPicker(true) }}
              aria-label="Change photo"
              title="Change photo"
              style={{ position: 'absolute', top: '-10px', left: '-10px', width: '32px', height: '32px', padding: 0, borderRadius: '50%', backgroundColor: INK, color: PAPER, border: `2px solid ${PAPER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <CsmIcon name="edit" size={15} strokeWidth={2.4} />
            </button>
            <Seal style={{ right: '-22px', bottom: '-14px' }} />
          </div>
          {isMobile && <BureauEmblem dark={dark} size={58} />}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '7px', paddingLeft: isMobile ? 0 : '10px' }}>
          <div>
            <div style={label}>DESIGNATION</div>
            <div style={{ ...value, fontSize: '28px', letterSpacing: '2px', wordBreak: 'break-word' }}>{username}</div>
          </div>
          <div>
            <div style={label}>RANK</div>
            <div style={{ ...value, fontSize: '15px' }}>{rank.title}</div>
          </div>
          <div>
            <div style={label}>DEPARTMENT</div>
            <div style={{ ...value, fontSize: '15px' }}>{roomName} · DIVISION 4</div>
          </div>
          <div>
            <div style={label}>ID NUMBER</div>
            <div style={{ ...value, fontSize: '15px' }}>{hunterId}</div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div><div style={label}>ISSUED</div><div style={{ ...value, fontSize: '12px' }}>{issueDate}</div></div>
            <div><div style={label}>EXPIRES</div><div style={{ ...value, fontSize: '12px' }}>{expDate}</div></div>
          </div>
          {isMobile && <div style={{ marginTop: '4px' }}><BarcodeH value={hunterId} dark={dark} /></div>}
        </div>

        {!isMobile && (
          <div style={{ width: '120px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <BureauEmblem dark={dark} />
            <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}><BarcodeH value={hunterId} dark={dark} /></div>
          </div>
        )}
      </div>

      <Wear />
      <Strip text="DEVIL HUNTER IDENTIFICATION CARD · TAP TO FLIP ↻" />
    </div>
  )

  // ── back: service record + rank + stamps ──
  const statRow = (k: string, v: string) => (
    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `2px dotted ${INK}`, padding: '5px 0' }}>
      <span style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', letterSpacing: '1px' }}>{k}</span>
      <span style={{ ...value, fontSize: '22px' }}>{v}</span>
    </div>
  )
  const back = (
    <div style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '16px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ ...value, fontSize: '24px', letterSpacing: '3px' }}>SERVICE RECORD</span>
          <span style={{ fontFamily: 'serif', fontSize: '12px', opacity: 0.55 }}>勤務記録</span>
        </div>
        {!isMobile && <span style={{ ...value, fontSize: '12px', opacity: 0.6 }}>{hunterId}</span>}
      </div>
      <div style={{ height: '3px', background: INK, margin: '6px 18px 10px' }} />

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '22px', padding: '0 18px' }}>
        <div style={{ flex: 1 }}>
          {statRow('LINES SPOKEN', n(stats?.lines))}
          {statRow('SHOUTS', n(stats?.shouts))}
          {statRow('REACTIONS GOT', n(stats?.reactions))}
          {statRow('CHAPTERS', n(stats?.chapters))}
          {statRow('DAYS ON DUTY', n(stats?.daysOnDuty))}
        </div>

        <div style={{ flex: 1.1 }}>
          <div style={label}>RANK</div>
          <div style={{ ...value, fontSize: '22px', letterSpacing: '2px' }}>{rank.title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontFamily: "'AnimeAce', sans-serif", fontSize: '9px' }}>
            <span>{rank.next ? `next: ${rank.next}` : 'top of the bureau'}</span>
            <span>{rank.nextAt ? `${stats?.lines ?? 0} / ${rank.nextAt}` : '★'}</span>
          </div>
          {/* chain-tooth progress bar */}
          <div aria-hidden style={{ height: '6px', width: `${Math.max(rank.progress * 100, 4)}%`, marginTop: '4px', marginLeft: '3px', background: `linear-gradient(135deg, transparent 50%, ${INK} 50%) 0 0 / 8px 6px repeat-x, linear-gradient(225deg, transparent 50%, ${INK} 50%) 0 0 / 8px 6px repeat-x` }} />
          <div role="progressbar" aria-valuenow={Math.round(rank.progress * 100)} aria-valuemin={0} aria-valuemax={100}
            style={{ height: '14px', border: `3px solid ${INK}`, borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${rank.progress * 100}%`, backgroundColor: INK }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '12px' }}>
            {stamps.map((a, i) => (
              <div key={a.id} title={a.earned ? 'earned' : 'not yet'} style={{
                aspectRatio: '1 / 1', borderRadius: '50%',
                border: `${a.earned ? 3 : 2}px ${a.earned ? 'solid' : 'dashed'} ${INK}`,
                opacity: a.earned ? 1 : 0.35,
                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                fontFamily: "'AnimeAce', sans-serif", fontWeight: 900, fontSize: isMobile ? '7px' : '7.5px', lineHeight: 1.15,
                whiteSpace: 'pre-line', transform: `rotate(${(i % 3 - 1) * 7}deg)`,
              }}>
                {a.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Strip text="SERVICE RECORD · TAP TO FLIP BACK ↻" />
    </div>
  )

  const btn = (kind: 'ink' | 'paper'): React.CSSProperties => ({
    padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '8px',
    background: kind === 'ink' ? 'var(--accent)' : PAPER, color: kind === 'ink' ? 'var(--on-accent)' : INK,
    border: `3px solid ${INK}`, borderRadius: '12px', boxShadow: `3px 3px 0 ${INK}`,
    fontFamily: 'BlambotClassic, sans-serif', fontSize: '14px', letterSpacing: '2px', cursor: 'pointer',
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 10px 90px' : '10px 20px 40px', color: INK }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* lanyard */}
        <div aria-hidden style={{ width: '34px', height: isMobile ? '40px' : '56px', borderLeft: `3px solid ${INK}`, borderRight: `3px solid ${INK}`, marginBottom: '-22px', position: 'relative', zIndex: 2 }} className="tone-light" />

        {/* the card — tap to flip */}
        <div style={{ perspective: '1400px', width: W, maxWidth: '100%' }}>
          <motion.div
            onClick={() => setFlipped(f => !f)}
            initial={{ y: 20, opacity: 0, rotate: -2 }}
            animate={{ y: 0, opacity: 1, rotate: -2, rotateY: flipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            role="button" aria-label={flipped ? 'Show card front' : 'Show service record'}
            style={{ position: 'relative', width: '100%', height: H, transformStyle: 'preserve-3d', cursor: 'pointer' }}
          >
            {front}
            {back}
          </motion.div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '22px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFlipped(f => !f)} style={btn('paper')}>
            ↻ {flipped ? 'FRONT' : 'SERVICE RECORD'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowPicker(true)} style={btn('paper')}>
            <CsmIcon name="profile" size={17} /> CHANGE PHOTO
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onLogout} style={btn('ink')}>
            <CsmIcon name="logout" size={17} /> TERMINATE SESSION
          </motion.button>
        </div>

        <div style={{ width: '100%', marginTop: '40px' }}>
          <CharacterPage
            username={username}
            avatarSrc={avatar.src}
            page={profile?.page ?? EMPTY_PAGE}
            stats={stats}
            editable
            compact={isMobile}
            onSaved={(page) => setProfile(p => (p ? { ...p, page } : p))}
          />
        </div>
      </div>

      <AnimatePresence>
        {showPicker && (
          <AvatarPicker
            avatar={avatar} dark={dark} cardBorder={cardBorder} textMain={textMain}
            onPick={(av) => { onAvatarChange(av); setShowPicker(false) }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
