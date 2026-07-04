import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AVATARS } from './UsernameScreen'
import { useWindowSize } from '../hooks/useWindowSize'

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
function BarcodeH({ value, dark }: { value: string; dark: boolean }) {
  const fg = dark ? '#fff' : '#111'
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

// vertical barcode (for desktop horizontal card)
function BarcodeV({ value, dark }: { value: string; dark: boolean }) {
  const fg = dark ? '#fff' : '#111'
  const seed = value.split('').map(c => c.charCodeAt(0))
  const len = seed.length || 1
  const bars = Array.from({ length: 36 }, (_, i) => ({
    w: (((seed[i % len] ?? 0) * (i + 7)) % 3) + 1,
    h: 24 + (((seed[(i + 2) % len] ?? 0) * (i + 1)) % 28),
    gap: (((seed[(i + 1) % len] ?? 0)) % 2) + 1,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '70px' }}>
        {bars.map((b, i) => (
          <div key={i} style={{ display: 'flex', gap: `${b.gap}px`, marginRight: `${b.gap}px` }}>
            <div style={{ width: `${b.w}px`, height: `${b.h}px`, background: fg, opacity: 0.88 }} />
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '1.5px', color: fg, opacity: 0.45 }}>
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
          boxShadow: '6px 6px 0 #cc2200',
          padding: '16px', maxWidth: '480px', width: '92%', // adaptive width for mobile
          maxHeight: '75vh', display: 'flex', flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          fontFamily: 'BlambotClassic, sans-serif', fontSize: '13px',
          letterSpacing: '3px', color: textMain,
          marginBottom: '14px', textAlign: 'center',
          borderBottom: '2px solid #cc2200', paddingBottom: '8px',
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
                border: `2px solid ${avatar.id === av.id ? '#cc2200' : (dark ? '#333' : '#ccc')}`,
                background: avatar.id === av.id ? 'rgba(204,34,0,0.1)' : 'transparent',
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
                  border: `2px solid ${avatar.id === av.id ? '#cc2200' : 'transparent'}` 
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
            boxShadow: '3px 3px 0 #cc2200',
            flexShrink: 0
          }}
        >
          CANCEL
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

export default function ProfileTab({
  avatar, username, rooms, currentRoom,
  T, theme, onLogout, onAvatarChange,
}: ProfileTabProps) {
  const [showPicker, setShowPicker] = useState(false)
  const { isMobile } = useWindowSize()

  const dark       = theme === 'dark'
  const cardBg     = dark ? '#1c1c1c' : '#f5f1e8'
  const cardBorder = dark ? '#fff' : '#111'
  const innerBg    = dark ? '#111' : '#fff'
  const textMain   = dark ? '#fff' : '#111'
  const textSub    = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.38)'

  const hunterId  = generateId(username)
  const issueDate = new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase().replace(/ /g, '')
  const expDate = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase().replace(/ /g, '')
  const roomName = rooms.find(r => r.id === currentRoom)?.name?.replace('#', '').trim() || 'PUBLIC'

  // ── MOBILE VERSION — vertical card as original ──────
  if (isMobile) {
    return (
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '16px 12px 80px',
      }}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          style={{
            width: '100%', maxWidth: '340px',
            background: cardBg,
            border: `3px solid ${cardBorder}`,
            boxShadow: dark ? '5px 5px 0 #fff' : '5px 5px 0 #111',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* red stripes */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: 'repeating-linear-gradient(180deg, #cc2200 0px, #cc2200 18px, transparent 18px, transparent 25px)', zIndex: 1 }} />
          <div style={{ position: 'absolute', left: '9px', top: 0, bottom: 0, width: '2px', background: 'repeating-linear-gradient(180deg, #cc2200 0px, #cc2200 18px, transparent 18px, transparent 25px)', opacity: 0.35, zIndex: 1 }} />

          {/* Header */}
          <div style={{ paddingLeft: '20px', paddingRight: '12px', paddingTop: '12px', paddingBottom: '8px', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, position: 'relative', zIndex: 2 }}>
            <div style={{ fontFamily: 'serif', fontSize: '14px', letterSpacing: '5px', color: textMain }}>日本国政府</div>
            <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '9px', letterSpacing: '3px', color: textSub, marginTop: '1px' }}>GOVERNMENT OF JAPAN</div>
          </div>

          {/* big picture */}
          <div style={{ paddingLeft: '20px', paddingRight: '12px', paddingTop: '14px', position: 'relative', zIndex: 2 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{ width: '140px', height: '170px', border: `2px solid ${cardBorder}`, background: dark ? '#2a2a2a' : '#ddd8cc', overflow: 'hidden' }}>
                <img src={avatar.src} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPicker(true)}
                style={{ position: 'absolute', top: '-10px', right: '-10px', width: '30px', height: '30px', background: '#cc2200', border: `2px solid ${cardBorder}`, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `2px 2px 0 ${cardBorder}`, zIndex: 3 }}
              >✏️</motion.button>

              {/* Emblem to the right of the photo */}
              <div style={{ position: 'absolute', top: '0', left: '155px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ background: innerBg, border: `2px solid ${cardBorder}`, padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '110px' }}>
                  <img src="/emblem.svg" alt="emblem" style={{ width: '60px', height: '60px', objectFit: 'contain', filter: dark ? 'invert(1) sepia(1) saturate(2) hue-rotate(5deg)' : 'none' }} />
                  <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '8px', color: '#cc2200', lineHeight: 1.3, textAlign: 'center' }}>PUBLIC SAFETY<br />DEVIL HUNTERS</div>
                  <div style={{ fontFamily: 'serif', fontSize: '7px', color: textSub }}>公安デビルハンター</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '8px', color: textSub, letterSpacing: '1px' }}>Designation</div>
                  <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '13px', color: '#cc2200', letterSpacing: '1px' }}>{avatar.name.toUpperCase()}</div>
                </div>
              </div>
            </div>

            {/* Name under the photo */}
            <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '22px', letterSpacing: '3px', color: textMain, marginTop: '8px', marginBottom: '12px' }}>
              {username}
            </div>

            {/* Separator */}
            <div style={{ height: '1px', background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', marginBottom: '12px' }} />

            {/* Data */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '9px', color: textSub, letterSpacing: '1px' }}>Department</div>
                  <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '16px', color: textMain, letterSpacing: '1px', lineHeight: 1.2 }}>{roomName}<br />DIVISION 4</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '9px', color: textSub, letterSpacing: '1px' }}>ID Number</div>
                  <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '14px', color: textMain, letterSpacing: '1px' }}>{hunterId}</div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '9px', color: textSub, letterSpacing: '1px' }}>Issue Date</div>
                    <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '12px', color: textMain }}>{issueDate}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '9px', color: textSub, letterSpacing: '1px' }}>Expired Date</div>
                    <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '12px', color: textMain }}>{expDate}</div>
                  </div>
                </div>
              </div>

              {/* Horizontal barcode on the right */}
              <BarcodeH value={hunterId} dark={dark} />
            </div>
          </div>

          {/* Bottom strip */}
          <div style={{ background: dark ? '#fff' : '#111', padding: '6px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '8px', letterSpacing: '2px', color: dark ? '#111' : '#fff' }}>DEVIL HUNTER IDENTIFICATION CARD</div>
            <div style={{ fontFamily: 'serif', fontSize: '8px', color: dark ? '#111' : '#fff', opacity: 0.35, marginTop: '2px', letterSpacing: '1px' }}>
              もう大丈夫、ここが僕たちの温かい家だよ。
            </div>
          </div>

          {/* Logout button */}
          <div style={{ padding: '10px 12px 12px 20px', position: 'relative', zIndex: 2 }}>
            <motion.button
              whileTap={{ x: 2, y: 2 }} onClick={onLogout}
              style={{ width: '100%', padding: '10px', background: '#cc2200', color: '#fff', border: `2px solid ${cardBorder}`, fontFamily: 'BlambotClassic, sans-serif', fontSize: '13px', letterSpacing: '3px', cursor: 'pointer', boxShadow: `3px 3px 0 ${cardBorder}` }}
            >
              TERMINATE SESSION 🌸
            </motion.button>
          </div>
        </motion.div>

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

  // ── desktop - original version ─────────────────────────
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', overflow: 'hidden' }}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        style={{
          width: '100%', maxWidth: '680px',
          background: cardBg, border: `3px solid ${cardBorder}`,
          boxShadow: dark ? '6px 6px 0 #fff' : '6px 6px 0 #111',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Red stripes */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '7px', background: 'repeating-linear-gradient(180deg, #cc2200 0px, #cc2200 20px, transparent 20px, transparent 28px)', zIndex: 1 }} />
        <div style={{ position: 'absolute', left: '10px', top: 0, bottom: 0, width: '2px', background: 'repeating-linear-gradient(180deg, #cc2200 0px, #cc2200 20px, transparent 20px, transparent 28px)', opacity: 0.35, zIndex: 1 }} />

        {/* Header */}
        <div style={{ paddingLeft: '22px', paddingRight: '14px', paddingTop: '12px', paddingBottom: '10px', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, position: 'relative', zIndex: 2 }}>
          <div style={{ fontFamily: 'serif', fontSize: '13px', letterSpacing: '5px', color: textMain }}>日本国政府</div>
          <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '9px', letterSpacing: '3px', color: textSub, marginTop: '1px' }}>GOVERNMENT OF JAPAN</div>
        </div>

        {/* Body */}
        <div style={{ paddingLeft: '22px', paddingRight: '14px', paddingTop: '14px', paddingBottom: '0', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            {/* Photo */}
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <div style={{ width: '190px', height: '225px', border: `2px solid ${cardBorder}`, background: dark ? '#2a2a2a' : '#ddd8cc', overflow: 'hidden' }}>
                <img src={avatar.src} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '26px', letterSpacing: '2px', color: textMain, textAlign: 'center', marginTop: '6px' }}>
                {username}
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }} onClick={() => setShowPicker(true)}
                style={{ position: 'absolute', top: '-10px', right: '-10px', width: '32px', height: '32px', background: '#cc2200', border: `2px solid ${cardBorder}`, cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `2px 2px 0 ${cardBorder}`, zIndex: 3 }}
              >✏️</motion.button>
            </div>

            {/* data */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: innerBg, border: `2px solid ${cardBorder}`, padding: '7px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <img src="/emblem.svg" alt="emblem" style={{ width: '80px', height: '80px', objectFit: 'contain', filter: dark ? 'invert(1) sepia(1) saturate(2) hue-rotate(5deg)' : 'none' }} />
                <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '11px', letterSpacing: '1px', color: '#cc2200', lineHeight: 1.35 }}>PUBLIC SAFETY<br />DEVIL HUNTERS</div>
                <div style={{ fontFamily: 'serif', fontSize: '10px', color: textSub }}>公安デビルハンター</div>
              </div>
              <div>
                <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '8px', color: textSub, letterSpacing: '1px' }}>Designation</div>
                <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '16px', color: '#cc2200', letterSpacing: '1px' }}>{avatar.name.toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', margin: '12px 0 10px 0', background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', paddingBottom: '14px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div>
                <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '8px', color: textSub, letterSpacing: '1px' }}>Department</div>
                <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '20px', color: textMain, letterSpacing: '1px', lineHeight: 1.25 }}>{roomName}<br />DIVISION 4</div>
              </div>
              <div>
                <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '8px', color: textSub, letterSpacing: '1px' }}>ID Number</div>
                <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '20px', color: textMain, letterSpacing: '1px' }}>{hunterId}</div>
              </div>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div>
                  <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '8px', color: textSub, letterSpacing: '1px' }}>Issue Date</div>
                  <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '13px', color: textMain }}>{issueDate}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '8px', color: textSub, letterSpacing: '1px' }}>Expired Date</div>
                  <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '13px', color: textMain }}>{expDate}</div>
                </div>
              </div>
            </div>
            <BarcodeV value={hunterId} dark={dark} />
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{ background: dark ? '#fff' : '#111', padding: '7px 22px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '8px', letterSpacing: '3px', color: dark ? '#111' : '#fff' }}>DEVIL HUNTER IDENTIFICATION CARD</div>
          <div style={{ fontFamily: 'serif', fontSize: '9px', color: dark ? '#111' : '#fff', opacity: 0.35, marginTop: '3px', letterSpacing: '1px' }}>
            もう大丈夫、ここгが僕たちの温かい家だよ。
          </div>
        </div>

        {/* Logout button */}
        <div style={{ padding: '10px 14px 14px 22px', position: 'relative', zIndex: 2 }}>
          <motion.button
            whileTap={{ x: 2, y: 2 }} onClick={onLogout}
            style={{ width: '100%', padding: '9px', background: '#cc2200', color: '#fff', border: `2px solid ${cardBorder}`, fontFamily: 'BlambotClassic, sans-serif', fontSize: '12px', letterSpacing: '3px', cursor: 'pointer', boxShadow: `3px 3px 0 ${cardBorder}` }}
          >
            TERMINATE SESSION 🌸
          </motion.button>
        </div>
      </motion.div>

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