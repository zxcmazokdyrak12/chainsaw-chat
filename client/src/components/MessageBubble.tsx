import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

export interface MessageData {
  id: number | string
  username: string | null
  content: string | null
  time: string
  rotate?: number
  avatar?: string
  isEdited?: boolean
  type?: string
  audioData?: any // Ослабим тип для гибкости приходящих данных от сокетов
  system?: boolean
  reactions?: Record<string, string[]>
}

interface AudioPlayerProps {
  src: string
  theme: string
}

export function AudioPlayer({ src, theme }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [currentTime, setCurrent] = useState<number>(0)
  const [error, setError] = useState<boolean>(false)

  // Исправление: Инициализируем duration, если метаданные уже упали в кэш браузера
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setError(false) // сбрасываем ошибку при смене источника

    const onLoaded = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }

    const onTime = () => {
      setCurrent(audio.currentTime)
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }

    const onEnded = () => {
      setPlaying(false)
      setProgress(0)
      setCurrent(0)
    }

    const onError = (e: any) => {
      console.error("Audio element error details:", audio.error)
      setError(true)
    }

    // Если аудио уже загрузилось (для быстрых Base64 строк)
    if (audio.readyState >= 1 && audio.duration) {
      setDuration(audio.duration)
    }

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
      // Перезапрашиваем duration на случай, если loadedmetadata проспал
      if (!duration && audio.duration) {
        setDuration(audio.duration)
      }
      
      audio.play()
        .then(() => setPlaying(true))
        .catch((err) => {
          console.error("Playback failed:", err)
          setError(true)
        })
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    // Если duration равен 0, но в самом аудио-элементе он есть — подставляем его
    const actualDuration = duration || audio?.duration
    if (!audio || !actualDuration || isNaN(actualDuration)) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    audio.currentTime = ratio * actualDuration
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
  const fill = 'var(--accent)'

  if (error) {
    return (
      <div style={{
        fontFamily: "'AnimeAce', sans-serif",
        fontSize: '10px', color: 'var(--accent)', opacity: 0.9,
        padding: '4px 0',
        display: 'flex', flexDirection: 'column', gap: '4px'
      }}>
        <span>⚠️ Ошибка проигрывания ГС</span>
        <span style={{ fontSize: '8px', opacity: 0.6 }}>Не поддерживаемый кодек или пустой файл</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '180px' }}>
      {/* Добавили preload="auto" для Base64 */}
      <audio ref={audioRef} src={src} preload="auto" crossOrigin="anonymous" />

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
              width: '100%', height: '6px', // Чуть толще, чтобы кликать было удобнее
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
            <span>{fmt(duration || audioRef.current?.duration || 0)}</span>
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

interface MessageBubbleProps {
  msg: MessageData
  index: number
  isOwn: boolean
  theme: string
  T: Record<string, string>
  username?: string
  seen?: boolean
  onReact?: (emoji: string) => void
  onContextMenu: (data: { x: number; y: number; msg: MessageData }) => void
}

export default function MessageBubble({ msg, index, isOwn, theme, T, username, seen, onReact, onContextMenu }: MessageBubbleProps) {
  const reactions = Object.entries(msg.reactions ?? {}).filter(([, users]) => users.length > 0)

  // long-press → context menu on touch screens
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef<boolean>(false)
  const cancelPress = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null }
  }
  useEffect(() => cancelPress, [])
  const ink = 'var(--ink)'
  const contentStr = msg.content || ''
  const isShout = contentStr === contentStr.toUpperCase()
    && contentStr.replace(/[^a-zA-Zа-яА-Я]/g, '').length > 2
  const isShort = msg.type !== 'audio' && contentStr.length <= 34 && !contentStr.includes('\n')

  return (
    <motion.div
      initial={{ x: isOwn ? 50 : -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
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
              border: '2px solid var(--ink)',
              flexShrink: 0,
              marginBottom: '18px',
              filter: 'grayscale(1) contrast(1.15)',
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
            {isOwn && (
              <span
                title={seen ? 'Seen' : 'Sent'}
                style={{ fontSize: '9px', letterSpacing: '1px', color: seen ? 'var(--accent)' : 'inherit', fontWeight: seen ? 900 : 'normal' }}
              >
                {seen ? '✓✓ SEEN' : '✓ SENT'}
              </span>
            )}
          </span>

          <div style={{ position: 'relative', marginBottom: isShout ? 0 : '14px' }}>
            {/* speech-bubble tail, glued under the bubble on the speaker's side */}
            {!isShout && (
              <svg
                viewBox="0 0 34 30" aria-hidden
                style={{
                  position: 'absolute', bottom: '-19px', width: '34px', height: '30px',
                  overflow: 'visible', zIndex: 2, pointerEvents: 'none',
                  ...(isOwn ? { right: '18%', transform: 'scaleX(-1)' } : { left: '18%' }),
                }}
              >
                <path d="M3 0 L31 0 L5 28 Z" fill="var(--paper)" />
                <path d="M28 7 L5 28 L10 8" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            )}

            {/* CAPS = a jagged shout balloon stretched behind the text */}
            {isShout && (
              <svg viewBox="0 0 380 150" preserveAspectRatio="none" aria-hidden
                style={{ position: 'absolute', inset: '-10px -16px', width: 'calc(100% + 32px)', height: 'calc(100% + 20px)', overflow: 'visible', pointerEvents: 'none' }}>
                <polygon
                  fill="var(--paper)" stroke="var(--ink)" strokeWidth="3.5" strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  points="20,40 60,48 70,8 110,36 150,4 175,34 215,6 235,36 285,12 290,44 345,30 330,62 372,76 332,90 352,124 300,108 288,144 245,114 215,146 185,112 140,140 120,108 70,132 72,100 18,110 46,78 4,62 44,56"
                />
              </svg>
            )}

            <div
              data-tour="bubble"
              className={isOwn && !isShout ? 'tone-light' : undefined}
              onDoubleClick={() => onReact?.('🔥')}
              onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                e.preventDefault()
                if (longPressFired.current) return
                onContextMenu({ x: e.clientX, y: e.clientY, msg })
              }}
              onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
                const t = e.touches[0]
                if (!t) return
                longPressFired.current = false
                const { clientX, clientY } = t
                if (pressTimer.current) clearTimeout(pressTimer.current)
                pressTimer.current = setTimeout(() => {
                  longPressFired.current = true
                  navigator.vibrate?.(15)
                  onContextMenu({ x: clientX, y: clientY, msg })
                }, 480)
              }}
              onTouchMove={cancelPress}
              onTouchEnd={cancelPress}
              onTouchCancel={cancelPress}
              style={{
                position: 'relative',
                maxWidth: isShout ? '320px' : '300px',
                minWidth: isShout ? '150px' : undefined,
                padding: isShout ? '26px 34px' : isShort ? '14px 26px' : '13px 20px',
                textAlign: isShort || isShout ? 'center' : 'left',
                // manga balloons: ovals for short lines, rounded boxes for long ones
                borderRadius: isShout ? 0 : isShort ? '50% / 50%' : '26px',
                backgroundColor: isShout ? 'transparent' : 'var(--paper)',
                border: isShout ? 'none' : '3px solid var(--ink)',
                color: 'var(--ink)',
                fontSize: isShout ? '18px' : 'var(--font-size-base, 14px)',
                fontFamily: isShout ? "'DeathRattle', 'AnimeAce', sans-serif" : "'AnimeAce', sans-serif",
                letterSpacing: isShout ? '2px' : '0.3px',
                lineHeight: '1.5',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                cursor: 'context-menu',
              }}
            >
              {msg.type === 'audio' && msg.audioData ? (
                <AudioPlayer src={msg.audioData} theme={theme} />
              ) : isOwn && !isShout ? (
                // own lines sit on a paper strip so the screentone never eats the letters
                <span style={{
                  backgroundColor: 'var(--paper)', padding: '1px 6px', borderRadius: '6px',
                  boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
                }}>
                  {msg.content}
                </span>
              ) : (
                msg.content
              )}
            </div>
          </div>

          {reactions.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '4px',
              justifyContent: isOwn ? 'flex-end' : 'flex-start',
              maxWidth: '280px', marginTop: '4px',
              paddingLeft: isOwn ? 0 : '8px', paddingRight: isOwn ? '8px' : 0,
            }}>
              {reactions.map(([emoji, users], i) => {
                const mine = !!username && users.includes(username)
                return (
                  <motion.button
                    key={emoji}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: i % 2 ? 3 : -3 }}
                    whileHover={{ scale: 1.12, rotate: 0 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => onReact?.(emoji)}
                    title={users.join(', ')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '3px',
                      padding: '1px 7px',
                      background: mine ? 'var(--accent)' : 'var(--paper)',
                      color: mine ? 'var(--on-accent)' : ink,
                      border: `2px solid ${ink}`,
                      fontFamily: "'AnimeAce', sans-serif", fontSize: '10px',
                      cursor: 'pointer', lineHeight: 1.6,
                    }}
                  >
                    <span style={{ fontSize: '13px', filter: 'grayscale(1) contrast(1.3)' }}>{emoji}</span>
                    {users.length}
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}