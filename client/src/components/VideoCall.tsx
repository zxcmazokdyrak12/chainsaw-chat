import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VideoCallApi } from '../hooks/useVideoCall'

const SLANT = 'polygon(8px 0,100% 0,calc(100% - 8px) 100%,0 100%)'
const PANEL_SFX = ['VRRR!', 'BZZT!', 'GRIND!', 'DOOOM!']

interface PanelProps {
  stream: MediaStream | null
  name: string
  avatar?: string
  index: number
  muted?: boolean
  mirrored?: boolean
  camOff?: boolean
  dark: boolean
}

// one manga panel = one participant
function Panel({ stream, name, avatar, index, muted, mirrored, camOff, dark }: PanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const ink = dark ? '#fff' : '#111'
  const hasVideo = !!stream && stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live') && !camOff

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0, rotate: index % 2 ? 4 : -4 }}
      animate={{ scale: 1, opacity: 1, rotate: index % 2 ? 0.8 : -0.8 }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        position: 'relative', overflow: 'hidden',
        background: '#111',
        border: `4px solid ${ink}`,
        boxShadow: `6px 6px 0 ${dark ? 'rgba(255,255,255,0.25)' : '#111'}`,
        minHeight: 0, minWidth: 0,
      }}
    >
      {/* video keeps playing audio even when the picture is hidden */}
      <video
        ref={videoRef}
        autoPlay playsInline muted={muted}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          transform: mirrored ? 'scaleX(-1)' : 'none',
          filter: 'contrast(1.15) saturate(0.85)',
          opacity: hasVideo ? 1 : 0,
        }}
      />

      {/* camera off / still connecting → avatar on halftone */}
      {!hasVideo && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px',
          background: '#1a1a1a',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
        }}>
          {avatar ? (
            <img src={avatar} style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #cc2200', boxShadow: '0 0 20px rgba(204,34,0,0.5)' }} />
          ) : (
            <div style={{ fontSize: '42px' }}>👤</div>
          )}
          <span style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', color: '#666', letterSpacing: '2px' }}>
            {stream ? 'CAMERA OFF' : 'CONNECTING...'}
          </span>
        </div>
      )}

      {/* halftone overlay to keep the manga look over live video */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.18) 1px, transparent 1px)',
        backgroundSize: '6px 6px',
      }} />

      <span style={{
        position: 'absolute', top: '8px', right: '10px',
        fontFamily: "'CCDoohickey', BlambotClassic, sans-serif",
        fontStyle: 'italic', fontWeight: 900, fontSize: '18px',
        color: '#fff', textShadow: '2px 2px 0 #cc2200, -1px -1px 0 #111',
        transform: 'rotate(8deg)', pointerEvents: 'none',
      }}>
        {PANEL_SFX[index % PANEL_SFX.length]}
      </span>

      <div style={{
        position: 'absolute', left: '-4px', bottom: '10px',
        padding: '4px 14px 4px 10px',
        background: '#cc2200', color: '#fff',
        border: '2px solid #111',
        fontFamily: "'AnimeAce', sans-serif", fontSize: '11px', letterSpacing: '2px',
        clipPath: 'polygon(0 0,100% 0,calc(100% - 8px) 100%,0 100%)',
      }}>
        {name}
      </div>
    </motion.div>
  )
}

interface VideoCallProps {
  call: VideoCallApi
  theme: string
  username: string
  avatar: string
  isMobile: boolean
}

export default function VideoCall({ call, theme, username, avatar, isMobile }: VideoCallProps) {
  const dark = theme === 'dark'
  const ink = dark ? '#fff' : '#111'
  const total = call.remotes.length + 1
  const cols = isMobile ? (total > 2 ? 2 : 1) : (total > 1 ? 2 : 1)

  const btn = (bg: string, fg: string) => ({
    padding: isMobile ? '10px 14px' : '10px 20px',
    background: bg, color: fg,
    border: `3px solid ${ink}`,
    boxShadow: `3px 3px 0 ${ink}`,
    fontFamily: 'BlambotClassic, sans-serif',
    fontSize: isMobile ? '12px' : '14px', letterSpacing: '2px',
    cursor: 'pointer', clipPath: SLANT,
  })

  return (
    <>
      {/* error toast (no access to camera, call is full...) */}
      <AnimatePresence>
        {call.error && !call.inCall && (
          <motion.div
            initial={{ y: -40, opacity: 0, rotate: -2 }} animate={{ y: 0, opacity: 1, rotate: -1 }} exit={{ y: -40, opacity: 0 }}
            onClick={call.clearError}
            style={{
              position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 60, padding: '8px 16px', cursor: 'pointer',
              background: '#cc2200', color: '#fff',
              border: `3px solid ${ink}`, boxShadow: `4px 4px 0 ${ink}`,
              fontFamily: "'AnimeAce', sans-serif", fontSize: '11px', letterSpacing: '1px',
            }}
          >
            <b style={{ fontFamily: "'CCDoohickey', BlambotClassic, sans-serif", fontStyle: 'italic', marginRight: '6px' }}>GRAAA!</b>
            {call.error.toUpperCase()} ✕
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {call.inCall && (
          <motion.div
            initial={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
            animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            exit={{ clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0, zIndex: 50,
              display: 'flex', flexDirection: 'column',
              background: dark ? '#0a0a0a' : '#f0ebe0',
              backgroundImage: `radial-gradient(circle, ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'} 1px, transparent 1px)`,
              backgroundSize: '10px 10px',
            }}
          >
            {/* title strip */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '10px 12px' : '12px 20px',
              borderBottom: `4px solid ${ink}`,
              background: dark ? '#111' : '#e8e3d8',
            }}>
              <h2 style={{
                margin: 0, fontSize: isMobile ? '16px' : '20px', letterSpacing: '3px',
                color: ink, textShadow: dark ? '3px 3px 0 #444' : '3px 3px 0 #cc2200',
                fontFamily: 'BlambotClassic, sans-serif',
              }}>
                VIDEO <span style={{ color: '#cc2200' }}>CALL</span>
              </h2>
              <span style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', letterSpacing: '2px', color: ink, opacity: 0.6 }}>
                {total} / 4 HUNTERS
              </span>
            </div>

            {/* panels */}
            <div style={{
              flex: 1, minHeight: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridAutoRows: '1fr',
              gap: isMobile ? '12px' : '18px',
              padding: isMobile ? '14px' : '24px',
            }}>
              <AnimatePresence>
                <Panel
                  key="me"
                  stream={call.localStream} name={`${username} (YOU)`} avatar={avatar}
                  index={0} muted mirrored camOff={!call.camOn} dark={dark}
                />
                {call.remotes.map((p, i) => (
                  <Panel key={p.socketId} stream={p.stream} name={p.username} index={i + 1} dark={dark} />
                ))}
              </AnimatePresence>
            </div>

            {call.remotes.length === 0 && (
              <p style={{
                margin: '0 0 8px', textAlign: 'center',
                fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', letterSpacing: '2px',
                color: ink, opacity: 0.5,
              }}>
                WAITING FOR OTHER DEVIL HUNTERS... SHARE THE ROOM CODE
              </p>
            )}

            {/* controls */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '12px',
              padding: isMobile ? '12px' : '16px',
              borderTop: `4px solid ${ink}`,
              background: dark ? '#111' : '#e8e3d8',
            }}>
              <motion.button whileTap={{ scale: 0.92 }} whileHover={{ skewX: -5 }} onClick={call.toggleMic}
                style={btn(call.micOn ? (dark ? '#222' : '#fff') : '#555', call.micOn ? ink : '#fff')}>
                {call.micOn ? '🎤 MIC' : '🔇 MUTED'}
              </motion.button>
              <motion.button whileTap={{ scale: 0.92 }} whileHover={{ skewX: -5 }} onClick={call.toggleCam}
                style={btn(call.camOn ? (dark ? '#222' : '#fff') : '#555', call.camOn ? ink : '#fff')}>
                {call.camOn ? '📹 CAM' : '🚫 CAM OFF'}
              </motion.button>
              <motion.button whileTap={{ scale: 0.92 }} whileHover={{ skewX: -5 }} onClick={call.leave}
                style={btn('#cc2200', '#fff')}>
                ✂ LEAVE
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
