import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CsmIcon from './CsmIcon'
import { useWindowSize } from '../hooks/useWindowSize'

// Interface for the VoiceWave component props
interface VoiceWaveProps {
  isRecording: boolean
  theme: string
}

// ANIMATED VOICE WAVE
function VoiceWave({ isRecording, theme }: VoiceWaveProps) {
  const bars = 20
  // Explicitly type the state as an array of numbers
  const [levels, setLevels] = useState<number[]>(Array(bars).fill(3))
  // Type the ref to hold the requestAnimationFrame ID (which is a number)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isRecording) {
      setLevels(Array(bars).fill(3))
      return
    }
    
    const animate = () => {
      setLevels(prev =>
        prev.map(() => 3 + Math.random() * 20)
      )
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isRecording])

  const color = theme === 'dark' ? '#fff' : '#111'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '2px',
      height: '28px', padding: '0 4px',
    }}>
      {levels.map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: isRecording ? h : 3 }}
          transition={{ duration: 0.08 }}
          style={{
            width: '3px',
            background: color,
            borderRadius: '2px',
            minHeight: '3px',
          }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────

// Interface representing the shape of a Room object
interface Room {
  id: string
  name: string
  [key: string]: any // Fallback for other backend-specific properties
}

// Props interface for the main InputBar component
interface InputBarProps {
  input: string
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  T: Record<string, string> // Design token theme object containing colors
  theme: string
  currentRoom: string
  rooms: Room[]
  sendOnEnter: boolean
}

export default function InputBar({
  input, onInputChange, onSend,
  isRecording, onStartRecording, onStopRecording,
  T, theme, currentRoom, rooms,
  sendOnEnter,
}: InputBarProps) {
  // Specify that the ref points directly to an HTML textarea element
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isMobile } = useWindowSize()

  // Explicitly type the keyboard event handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendOnEnter) {
      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        onSend()
      }
    } else {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        onSend()
      }
    }
  }

  // Explicitly type the textarea change event handler
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Auto-resize the textarea based on scroll height
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
    onInputChange(e)
  }

  const hint = sendOnEnter
    ? 'Enter — send · Shift+Enter — newline'
    : 'Ctrl+Enter — send · Enter — newline'

  const roomName = rooms.find(r => r.id === currentRoom)?.name || ''
  const letters = input.replace(/[^a-zA-Zа-яА-Я]/g, '')
  const shout = letters.length > 2 && input === input.toUpperCase()
  const hasText = input.trim().length > 0
  const ink = 'var(--ink)'

  return (
    <div style={{
      background: T.inputZoneBg,
      transition: 'background 0.4s',
      padding: isMobile ? '14px 10px 8px' : '16px 14px 8px',
      display: 'flex', flexDirection: 'column', gap: '5px',
    }}>
      <div style={{ display: 'flex', gap: isMobile ? '14px' : '16px', alignItems: 'flex-end' }}>

        {/* mic: round ink button, turns into a blood drop while recording */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          data-tour="mic"
          onMouseDown={onStartRecording}
          onMouseUp={onStopRecording}
          onTouchStart={onStartRecording}
          onTouchEnd={onStopRecording}
          title={isRecording ? 'release to send' : 'hold to record'}
          aria-label={isRecording ? 'Release to send voice message' : 'Hold to record a voice message'}
          style={{
            position: 'relative',
            width: '44px', height: '44px', borderRadius: '50%',
            flexShrink: 0,
            background: isRecording ? 'var(--blood)' : 'var(--paper)',
            color: isRecording ? '#f5f2ea' : ink,
            border: `3px solid ${isRecording ? 'var(--blood)' : ink}`,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >
          <CsmIcon name={isRecording ? 'drop' : 'mic'} size={21} strokeWidth={2.3} />
          {isRecording && (
            <motion.span
              animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '3px solid var(--blood)' }}
            />
          )}
        </motion.button>

        {/* the line you're writing lives in a speech balloon; CAPS turns it into a shout */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="wave"
                initial={{ opacity: 0, scaleX: 0.8 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0.8 }}
                style={{
                  background: 'var(--paper)',
                  border: '3px solid var(--blood)', borderRadius: '22px',
                  display: 'flex', alignItems: 'center',
                  padding: '0 14px', minHeight: '44px',
                  overflow: 'hidden',
                }}
              >
                <span style={{
                  fontFamily: "'AnimeAce', sans-serif",
                  fontSize: '10px', color: 'var(--blood)',
                  marginRight: '8px', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  ● REC
                </span>
                <VoiceWave isRecording={isRecording} theme={theme} />
              </motion.div>
            ) : (
              <motion.div
                key="balloon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'relative',
                  backgroundColor: 'var(--paper)',
                  border: `${shout ? 4 : 3}px solid ${ink}`,
                  borderRadius: shout ? '10px' : '22px',
                  boxShadow: shout ? `4px 4px 0 ${ink}` : 'none',
                  transform: shout ? 'rotate(-0.6deg)' : 'none',
                  transition: 'border-radius 0.15s, box-shadow 0.15s, transform 0.15s',
                }}
              >
                {/* balloon tail pointing at the mic, like you're the one speaking */}
                <svg viewBox="0 0 20 16" aria-hidden style={{ position: 'absolute', left: '-15px', bottom: '8px', width: '20px', height: '16px', overflow: 'visible' }}>
                  <path d="M20 1 L1 9 L20 15 Z" fill="var(--paper)" />
                  <path d="M17 2.2 L1 9 L17 13.8" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <textarea
                  data-tour="input"
                  ref={textareaRef}
                  rows={1}
                  style={{
                    display: 'block', width: '100%', boxSizing: 'border-box',
                    padding: '11px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '0',
                    color: T.inputColor,
                    fontSize: shout ? 'calc(var(--font-size-base, 14px) + 2px)' : 'var(--font-size-base, 14px)',
                    outline: 'none',
                    fontFamily: shout ? "'DeathRattle', 'AnimeAce', sans-serif" : "'AnimeAce', sans-serif",
                    letterSpacing: shout ? '2px' : '0.5px',
                    resize: 'none',
                    overflow: 'hidden',
                    lineHeight: '1.45',
                    minHeight: '42px',
                    maxHeight: '110px',
                  }}
                  value={input}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder={isMobile ? 'Your line…' : `Your line in ${roomName || 'the room'}…`}
                />
                {shout && (
                  <motion.span
                    initial={{ scale: 1.6, opacity: 0, rotate: 12 }}
                    animate={{ scale: 1, opacity: 1, rotate: 8 }}
                    style={{
                      position: 'absolute', right: '10px', top: '-13px',
                      fontFamily: 'BlambotClassic, sans-serif', fontSize: '12px', letterSpacing: '2px',
                      background: 'var(--ink)', color: 'var(--paper)',
                      padding: '1px 8px', borderRadius: '6px', pointerEvents: 'none',
                    }}
                  >
                    SHOUT!
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* send: a chainsaw guide bar — the chain starts running once there's something to send */}
        <motion.button
          whileTap={{ scale: 0.94, x: 3 }}
          whileHover={{ x: 2 }}
          onClick={onSend}
          data-tour="send"
          aria-label="Send"
          className={hasText ? 'chain-bar chain-run' : 'chain-bar'}
          style={{
            position: 'relative',
            height: '44px', padding: isMobile ? '0 16px 0 12px' : '0 20px 0 14px',
            background: T.btnBg, color: T.btnColor,
            border: `3px solid ${T.inputBorder}`,
            borderRadius: '10px 999px 999px 10px',
            fontFamily: 'BlambotClassic, sans-serif',
            fontSize: '15px', letterSpacing: '2px',
            cursor: 'pointer',
            flexShrink: 0, whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: '8px',
            opacity: hasText ? 1 : 0.8,
          }}
        >
          <CsmIcon name="send" size={isMobile ? 20 : 18} strokeWidth={2.3} />
          {!isMobile && 'VROOM'}
        </motion.button>
      </div>

      {/* hint line */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', gap: '10px',
        fontSize: '9px',
        fontFamily: "'AnimeAce', sans-serif",
        color: T.titleColor,
        letterSpacing: '0.5px', paddingLeft: isMobile ? '58px' : '64px', paddingRight: '6px',
      }}>
        <span style={{ opacity: 0.4 }}>{shout ? 'CAPS LOCK — your line will be shouted' : hint}</span>
        {input.length > 200 && <span style={{ opacity: 0.6 }}>{input.length}</span>}
      </div>
    </div>
  )
}
