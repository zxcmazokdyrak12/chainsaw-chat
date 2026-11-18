import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AudioPlayer } from './AudioPlayer'
import { BalloonTail, ShoutBalloon } from './Balloon'
import { isShout as looksLikeShout } from '../lib/sound'

// kept for older imports
export { AudioPlayer }

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
  onAvatarClick?: (username: string, avatar?: string) => void
}

export default function MessageBubble({ msg, index, isOwn, theme, T, username, seen, onReact, onContextMenu, onAvatarClick }: MessageBubbleProps) {
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
  const isShout = looksLikeShout(contentStr)
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
            alt={msg.username ? `${msg.username} — open character page` : 'avatar'}
            title={msg.username ? `${msg.username}'s character page` : undefined}
            onClick={() => msg.username && onAvatarClick?.(msg.username, msg.avatar)}
            style={{
              cursor: onAvatarClick ? 'pointer' : 'default',
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
            {!isShout && <BalloonTail own={isOwn} />}
            {isShout && <ShoutBalloon />}

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