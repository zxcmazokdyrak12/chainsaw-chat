import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

  return (
    <div style={{
      background: T.inputZoneBg,
      borderTop: `3px solid ${T.inputBorder}`,
      transition: 'background 0.4s',
      padding: '8px 12px',
      display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>

        {/* mic button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onMouseDown={onStartRecording}
          onMouseUp={onStopRecording}
          onTouchStart={onStartRecording}
          onTouchEnd={onStopRecording}
          title={isRecording ? 'release to send' : 'hold to record'}
          style={{
            width: '36px', height: '36px',
            flexShrink: 0,
            background: isRecording ? '#cc2200' : T.inputBg,
            border: `2px solid ${T.inputBorder}`,
            cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >
          {isRecording ? '⏹' : '🎤'}
        </motion.button>

        {/* MAIN INPUT ZONE OR WAVE DURING RECORDING */}
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="wave"
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0.8 }}
              style={{
                flex: 1,
                background: T.inputBg,
                border: `2px solid #cc2200`,
                display: 'flex', alignItems: 'center',
                padding: '0 8px', minHeight: '36px',
                overflow: 'hidden',
              }}
            >
              <span style={{
                fontFamily: "'AnimeAce', sans-serif",
                fontSize: '10px', color: '#cc2200',
                marginRight: '8px', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                REC ●
              </span>
              <VoiceWave isRecording={isRecording} theme={theme} />
            </motion.div>
          ) : (
            <motion.textarea
              key="input"
              ref={textareaRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              rows={1}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: T.inputBg,
                border: `2px solid ${T.inputBorder}`,
                color: T.inputColor,
                fontSize: 'var(--font-size-base, 14px)',
                outline: 'none',
                fontFamily: 'BlambotClassic, sans-serif',
                letterSpacing: '1px',
                transition: 'background 0.4s',
                resize: 'none',
                overflow: 'hidden',
                lineHeight: '1.4',
                minHeight: '36px',
                maxHeight: '100px',
                clipPath: 'polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)',
              }}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={`write in ${roomName}...`}
            />
          )}
        </AnimatePresence>

        {/* SEND BUTTON */}
        <motion.button
          whileTap={{ scale: 0.92, skewX: -5 }}
          whileHover={{ skewX: -5 }}
          onClick={onSend}
          style={{
            padding: '0 14px', height: '36px',
            background: T.btnBg, color: T.btnColor,
            border: `2px solid ${T.inputBorder}`,
            fontFamily: 'BlambotClassic, sans-serif',
            fontSize: '13px', letterSpacing: '2px',
            cursor: 'pointer',
            clipPath: 'polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%)',
            boxShadow: T.shadow, transition: 'background 0.4s',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          VROOM ⛓
        </motion.button>
      </div>

      {/* HINT FOR HOTKEYS */}
      <div style={{
        fontSize: '9px',
        fontFamily: "'AnimeAce', sans-serif",
        color: T.titleColor, opacity: 0.3,
        letterSpacing: '0.5px', paddingLeft: '44px',
      }}>
        {hint}
      </div>
    </div>
  )
}