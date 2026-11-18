import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AudioPlayer } from './AudioPlayer'
import { BalloonTail, ShoutBalloon } from './Balloon'
import { isShout as looksLikeShout } from '../lib/sound'
import { reactionInfo } from '../config'
import { mediaUrl } from '../lib/media'
import { findCommand } from '../lib/commands'
import { maskSpoilers } from '../lib/spoiler'
import RichText from './RichText'
import ContractCard, { type PollData } from './ContractCard'

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
  media?: string | null
  replyTo?: { id: number; username: string | null; content: string; type: string } | null
  poll?: PollData | null
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
  onQuoteClick?: (id: number) => void
  onOpenImage?: (src: string) => void
  highlight?: boolean
  onVote?: (messageId: number, optionId: string) => void
  onPollClose?: (messageId: number) => void
  onReply?: (msg: MessageData) => void
}

export default function MessageBubble({ msg, index, isOwn, theme, T, username, seen, onReact, onContextMenu, onAvatarClick, onQuoteClick, onOpenImage, highlight, onVote, onPollClose, onReply }: MessageBubbleProps) {
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
  const isImage = msg.type === 'image' && !!msg.media
  const poll = msg.type === 'contract' && msg.poll ? msg.poll : null
  const command = msg.type === 'text' || !msg.type ? findCommand(contentStr) : null
  const isShout = !isImage && !poll && !command && looksLikeShout(contentStr)
  const isShort = msg.type !== 'audio' && !isImage && !poll && !msg.replyTo && contentStr.length <= 34 && !contentStr.includes('\n')
  const audioSrc = msg.type === 'audio' ? (msg.media ? mediaUrl(msg.media) : msg.audioData) : null

  return (
    <motion.div
      id={`msg-${msg.id}`}
      initial={{ x: isOwn ? 50 : -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        transform: `rotate(${msg.rotate || 0}deg)`,
        scrollMarginTop: '80px',
        // jumped to from search / a quote: a short ink flash
        animation: highlight ? 'csm-flash 1.4s ease-out' : undefined,
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
              tabIndex={0}
              aria-label={`${msg.username ?? ''}${msg.time ? `, ${msg.time}` : ''}: ${msg.type === 'image' ? 'picture' : msg.type === 'audio' ? 'voice message' : maskSpoilers(contentStr)}`}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.target !== e.currentTarget) return // keys inside (spoilers, buttons) handle themselves
                if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey && onReply) { e.preventDefault(); onReply(msg); return }
                if (e.key === 'Enter' || e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
                  e.preventDefault()
                  const r = e.currentTarget.getBoundingClientRect()
                  onContextMenu({ x: r.left + 12, y: r.bottom - 4, msg })
                }
              }}
              className={isOwn && !isShout && !isImage && !poll ? 'tone-light' : undefined}
              onDoubleClick={() => onReact?.('like')}
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
                maxWidth: isShout ? '320px' : isImage ? '340px' : '300px',
                minWidth: isShout ? '150px' : undefined,
                padding: isShout ? '26px 34px' : isImage || poll ? '8px' : isShort ? '14px 26px' : '13px 20px',
                textAlign: isShort || isShout ? 'center' : 'left',
                // manga balloons: ovals for short lines, rounded boxes for long ones
                borderRadius: isShout ? 0 : isImage || poll ? '6px' : isShort ? '50% / 50%' : '26px',
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
              {msg.replyTo && (
                <button
                  onClick={(e) => { e.stopPropagation(); onQuoteClick?.(msg.replyTo!.id) }}
                  title="Jump to the quoted line"
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    margin: '0 0 8px', padding: '4px 8px', boxSizing: 'border-box',
                    background: 'var(--paper)', color: 'var(--ink)',
                    border: 'none', borderLeft: '4px solid var(--ink)',
                    fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', lineHeight: 1.45, opacity: 0.8,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  } as React.CSSProperties}
                >
                  <b style={{ fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '1px' }}>{msg.replyTo.username}</b>{' '}
                  {msg.replyTo.type === 'image' ? '🖼 picture ' : msg.replyTo.type === 'audio' ? '🎤 voice ' : ''}
                  {maskSpoilers(msg.replyTo.content)}
                </button>
              )}
              {poll ? (
                <ContractCard
                  poll={poll}
                  me={username}
                  isAuthor={isOwn}
                  onVote={(opt) => typeof msg.id === 'number' && onVote?.(msg.id, opt)}
                  onClose={() => typeof msg.id === 'number' && onPollClose?.(msg.id)}
                />
              ) : command ? (
                // a chat command: lettering instead of words
                <span style={{
                  display: 'inline-block', fontFamily: "'DeathRattle', 'BlambotClassic', sans-serif",
                  fontSize: '22px', letterSpacing: '1px', color: 'var(--paper)',
                  WebkitTextStroke: '1.5px var(--ink)', textShadow: '2px 2px 0 var(--ink)', transform: 'rotate(-3deg)',
                }}>
                  {command.sfx}
                </span>
              ) : isImage ? (
                <>
                  {/* a picture is pasted in like a cut-out manga panel */}
                  <img
                    src={mediaUrl(msg.media!)} alt={contentStr || 'picture'} loading="lazy"
                    onClick={(e) => { e.stopPropagation(); onOpenImage?.(mediaUrl(msg.media!)) }}
                    style={{
                      display: 'block', maxWidth: '100%', maxHeight: '320px', minWidth: '120px', minHeight: '80px',
                      objectFit: 'cover', cursor: 'zoom-in', background: 'var(--ink)',
                      border: '3px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)', transform: 'rotate(-0.8deg)',
                    }}
                  />
                  {contentStr && <div style={{ marginTop: '8px' }}><RichText text={msg.content} /></div>}
                </>
              ) : audioSrc ? (
                <AudioPlayer src={audioSrc} theme={theme} />
              ) : isOwn && !isShout ? (
                // own lines sit on a paper strip so the screentone never eats the letters
                <span style={{
                  backgroundColor: 'var(--paper)', padding: '1px 6px', borderRadius: '6px',
                  boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
                }}>
                  <RichText text={msg.content} />
                </span>
              ) : (
                <RichText text={msg.content} />
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
                    title={`${reactionInfo(emoji)?.label ?? emoji}: ${users.join(', ')}`}
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
                    {reactionInfo(emoji) ? (
                      <img src={reactionInfo(emoji)!.src} alt={reactionInfo(emoji)!.label}
                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid currentColor', background: '#fff', margin: '1px 0 1px -5px' }} />
                    ) : (
                      <span style={{ fontSize: '13px', filter: 'grayscale(1) contrast(1.3)' }}>{emoji}</span>
                    )}
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