import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

// describe the structure of a message object
export interface MessageData {
  id: number
  username: string | null
  content: string | null
  time: string
  rotate?: number
  avatar?: string
  isEdited?: boolean
  type?: string
  audioData?: string
  system?: boolean
}

// Пропсы для плеера
interface AudioPlayerProps {
  src: string
  theme: string
}

// custom audio player component 
export function AudioPlayer({ src, theme }: AudioPlayerProps) {
  // showing typescript types for useRef and useState
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [currentTime, setCurrent] = useState<number>(0)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoaded = () => setDuration(audio.duration)
    const onTime = () => {
      setCurrent(audio.currentTime)
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrent(0) }
    const onError = () => setError(true)

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => setError(true))
      setPlaying(true)
    }
  }

  // type guard for mouse event
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    audio.currentTime = ratio * duration
  }

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const dark = theme === 'dark'
  const fg = dark ? '#fff' : '#111'
  const track = dark ? '#555' : '#ccc'
  const fill = '#cc2200'

  if (error) {
    return (
      <div style={{
        fontFamily: "'AnimeAce', sans-serif",
        fontSize: '10px', color: '#cc2200', opacity: 0.7,
        padding: '4px 0',
      }}>
        🎤 voice message
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '6px',
      width: '180px',
    }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          style={{
            width: '28px', height: '28px',
            flexShrink: 0,
            background: fill,
            border: `2px solid ${fg}`,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', color: '#fff',
            boxShadow: `2px 2px 0 ${fg}`,
          }}
        >
          {playing ? '⏸' : '▶'}
        </motion.button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            onClick={handleSeek}
            style={{
              width: '100%', height: '4px',
              background: track,
              cursor: 'pointer',
              position: 'relative',
              border: `1px solid ${fg}`,
            }}
          >
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: fill,
              transition: 'width 0.1s linear',
            }} />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: "'AnimeAce', sans-serif",
            fontSize: '9px', color: fg, opacity: 0.6,
          }}>
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>

      <div style={{
        fontFamily: "'AnimeAce', sans-serif",
        fontSize: '9px', color: fg, opacity: 0.4,
        letterSpacing: '1px',
        textAlign: 'right',
      }}>
        🎤 VOICE MSG
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────

const SFX_WORDS = ['VROOM!', 'SLASH!', 'BANG!', 'GRAAA!', 'DOOOM!', 'GRIND!']

// props for MessageBubble component
interface MessageBubbleProps {
  msg: MessageData
  index: number
  isOwn: boolean
  theme: string
  T: Record<string, string> // theme colors for the message bubble
  onContextMenu: (data: { x: number; y: number; msg: MessageData }) => void
}

export default function MessageBubble({ msg, index, isOwn, theme, T, onContextMenu }: MessageBubbleProps) {
  const contentStr = msg.content || ''
  const isShout = contentStr === contentStr.toUpperCase()
    && contentStr.replace(/[^a-zA-Zа-яА-Я]/g, '').length > 2

  return (
    <motion.div
      initial={{ x: isOwn ? 50 : -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        transform: `rotate(${msg.rotate || 0}deg)`,
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '8px',
      }}>
        {msg.avatar && (
          <img
            src={msg.avatar}
            alt="avatar"
            style={{
              width: '30px', height: '30px',
              borderRadius: '50%', objectFit: 'cover',
              border: `2px solid ${theme === 'light' ? '#111' : '#fff'}`,
              flexShrink: 0,
              marginBottom: '4px',
            }}
          />
        )}

        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start', gap: '3px',
        }}>
          <span style={{
            fontFamily: "'CCDoohickey', BlambotClassic, sans-serif",
            fontSize: '13px', fontWeight: 900, fontStyle: 'italic',
            color: T.sfxColor, letterSpacing: '1px',
            paddingLeft: isOwn ? 0 : '14px',
            paddingRight: isOwn ? '14px' : 0,
          }}>
            {SFX_WORDS[index % SFX_WORDS.length]}
          </span>

          <span style={{
            fontSize: '10px', letterSpacing: '2px',
            color: isOwn ? (theme === 'light' ? '#666' : '#555') : T.nameColor,
            paddingLeft: isOwn ? 0 : '4px',
            paddingRight: isOwn ? '4px' : 0,
            fontFamily: "'AnimeAce', sans-serif",
            display: 'flex', alignItems: 'center', gap: '4px',
            flexDirection: isOwn ? 'row-reverse' : 'row',
          }}>
            {msg.username} · {msg.time}
            {msg.isEdited && <span style={{ opacity: 0.5, fontSize: '9px' }}>✏️</span>}
          </span>

          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', bottom: '20px',
              ...(isOwn
                ? { right: '-18px', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: `18px solid ${theme === 'dark' ? '#fff' : '#111'}` }
                : { left: '-18px', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: `18px solid ${theme === 'dark' ? '#fff' : '#111'}` }
              ),
              zIndex: 2,
            }} />
            <div style={{
              position: 'absolute', bottom: '22px',
              ...(isOwn
                ? { right: '-13px', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: `14px solid ${theme === 'dark' ? '#222' : '#fff'}` }
                : { left: '-13px', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: `14px solid ${theme === 'dark' ? '#222' : '#fff'}` }
              ),
              zIndex: 3,
            }} />

            <div
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                e.preventDefault()
                onContextMenu({ x: e.clientX, y: e.clientY, msg })
              }}
              style={{
                position: 'relative',
                maxWidth: '280px',
                padding: '12px 16px 14px 16px',
                borderRadius: isOwn
                  ? '50% 50% 20% 50% / 50% 50% 50% 20%'
                  : '50% 50% 50% 20% / 50% 50% 20% 50%',
                background: theme === 'dark' ? '#222' : '#fff',
                border: `3px solid ${theme === 'dark' ? '#fff' : '#111'}`,
                boxShadow: isOwn
                  ? (theme === 'dark' ? '3px 3px 0 #fff' : '3px 3px 0 #111')
                  : (theme === 'dark' ? '-3px 3px 0 #fff' : '-3px 3px 0 #111'),
                color: theme === 'dark' ? '#fff' : '#111',
                fontSize: isShout ? '17px' : 'var(--font-size-base, 14px)',
                fontWeight: isShout ? 900 : 'normal',
                fontFamily: isShout ? "'DeathRattle', sans-serif" : "'BlambotClassic', sans-serif",
                letterSpacing: isShout ? '2px' : 'normal',
                lineHeight: '1.5',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                transition: 'background 0.3s',
                cursor: 'context-menu',
              }}
            >
              {msg.type === 'audio' && msg.audioData
                ? <AudioPlayer src={msg.audioData} theme={theme} />
                : msg.content
              }
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}