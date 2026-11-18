import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CsmIcon from './CsmIcon'
import { wrapSelection, maskSpoilers } from '../lib/spoiler'
import { mentionQuery } from '../lib/mentions'
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

// jagged SFX burst outline for the send button (viewBox 120×70)
const BURST_POINTS = '8,22 30,24 34,4 52,20 66,2 74,20 96,8 92,28 116,32 96,42 112,62 86,52 80,68 62,52 48,68 42,52 20,64 26,46 2,44 22,34'

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
  onAttach?: (file: File) => void           // a picture: button, paste or drag & drop
  uploading?: boolean
  reply?: { username: string | null; content: string; type?: string } | null
  onCancelReply?: () => void
  onQuickReply?: () => void              // ↑ in an empty input
  onSetInput?: (value: string) => void   // replace the whole line (spoiler shortcut)
  onEditLast?: () => void                // Ctrl+↑: edit your last line
  editing?: { content: string } | null
  onCancelEdit?: () => void
  people?: string[]                      // names for the @ autocomplete
}

export default function InputBar({
  input, onInputChange, onSend,
  isRecording, onStartRecording, onStopRecording,
  T, theme, currentRoom, rooms,
  sendOnEnter, onAttach, uploading = false, reply, onCancelReply, onQuickReply, onSetInput, onEditLast, editing, onCancelEdit, people = [],
}: InputBarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  // @ autocomplete: what's typed after "@", and which suggestion is highlighted
  const [caret, setCaret] = useState(0)
  const [pick, setPick] = useState(0)
  const [mentionOff, setMentionOff] = useState(false)
  const mq = mentionQuery(input, caret)
  const suggestions = mq && !mentionOff
    ? people.filter(n => n.toUpperCase().startsWith(mq.query.toUpperCase()) && n.toUpperCase() !== mq.query.toUpperCase()).slice(0, 6)
    : []
  const choose = (name: string) => {
    if (!mq || !onSetInput) return
    const next = input.slice(0, mq.start) + '@' + name + ' ' + input.slice(caret)
    onSetInput(next)
    const pos = mq.start + name.length + 2
    requestAnimationFrame(() => { const t = textareaRef.current; if (t) { t.focus(); t.selectionStart = t.selectionEnd = pos; setCaret(pos) } })
  }
  const [dragOver, setDragOver] = useState(false)
  const firstImage = (list: FileList | DataTransferItemList | null | undefined): File | null => {
    if (!list) return null
    for (const item of Array.from(list as ArrayLike<File | DataTransferItem>)) {
      const f = item instanceof File ? item : item.kind === 'file' ? item.getAsFile() : null
      if (f && f.type.startsWith('image/')) return f
    }
    return null
  }
  useEffect(() => { if (reply || editing) textareaRef.current?.focus() }, [reply, editing])
  // Specify that the ref points directly to an HTML textarea element
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isMobile } = useWindowSize()
  // bumps on every send so the burst re-plays its slam-in
  const [burstKey, setBurstKey] = useState<number>(0)

  // Explicitly type the keyboard event handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && e.altKey)) { e.preventDefault(); const fwd = e.key === 'ArrowDown' || e.key === 'ArrowRight'; setPick(p => (p + (fwd ? 1 : suggestions.length - 1)) % suggestions.length); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); choose(suggestions[Math.min(pick, suggestions.length - 1)]!); return }
      if (e.key === 'Escape') { e.preventDefault(); setMentionOff(true); return }
    }
    if (e.key === 'Escape' && editing) { e.preventDefault(); onCancelEdit?.(); return }
    if (e.key === 'Escape' && reply) { onCancelReply?.(); return }
    // Ctrl+↑: edit your last line (like Telegram's ↑)
    if (e.key === 'ArrowUp' && (e.ctrlKey || e.metaKey) && !input && onEditLast) { e.preventDefault(); onEditLast(); return }
    // Ctrl+Shift+S: hide the selection behind a ||spoiler||
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyS' && onSetInput) {
      e.preventDefault()
      const el = e.currentTarget
      const { value, caret } = wrapSelection(input, el.selectionStart, el.selectionEnd)
      onSetInput(value)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = caret })
      return
    }
    // ↑ in an empty line: answer the last message
    if (e.key === 'ArrowUp' && !e.ctrlKey && !e.metaKey && !input && !reply && !editing && onQuickReply) { e.preventDefault(); onQuickReply(); return }
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
    <div
      onDragOver={onAttach ? (e) => { if (Array.from(e.dataTransfer.types).includes('Files')) { e.preventDefault(); setDragOver(true) } } : undefined}
      onDragLeave={() => setDragOver(false)}
      onDrop={onAttach ? (e) => { e.preventDefault(); setDragOver(false); const f = firstImage(e.dataTransfer.files); if (f) onAttach(f) } : undefined}
      style={{
      position: 'relative',
      background: T.inputZoneBg,
      transition: 'background 0.4s',
      padding: isMobile ? '14px 10px 8px' : '16px 14px 8px',
      display: 'flex', flexDirection: 'column', gap: '5px',
      outline: dragOver ? '3px dashed var(--ink)' : 'none', outlineOffset: '-6px',
    }}>
      {dragOver && (
        <div aria-hidden style={{
          position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          fontFamily: "'DeathRattle', 'BlambotClassic', sans-serif", fontSize: '26px', color: 'var(--paper)',
          WebkitTextStroke: '2px var(--ink)', textShadow: '3px 3px 0 var(--ink)',
        }}>DROP THE PANEL!</div>
      )}

      {/* @ autocomplete: the cast, as chips in the strip above the balloon */}
      {suggestions.length > 0 && (
        <div role="listbox" aria-label="Mention someone" style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
          paddingLeft: isMobile ? '58px' : '64px', paddingRight: '6px',
          fontFamily: "'AnimeAce', sans-serif", fontSize: '11px',
        }}>
          <span aria-hidden style={{ color: 'var(--ink)', opacity: 0.7 }}>@</span>
          {suggestions.map((n, i) => (
            <span key={n} role="option" aria-selected={i === pick}
              onMouseDown={(e) => { e.preventDefault(); choose(n) }}
              style={{
                padding: '2px 8px', cursor: 'pointer', borderRadius: '3px', border: '2px solid var(--ink)',
                background: i === pick ? 'var(--ink)' : 'var(--paper)', color: i === pick ? 'var(--paper)' : 'var(--ink)',
              }}>
              {n}
            </span>
          ))}
          <span style={{ color: 'var(--ink)', opacity: 0.55, fontSize: '9px' }}>Tab / Enter · ↑↓</span>
        </div>
      )}

      {/* editing: the same strip, saying what you're changing */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', paddingLeft: isMobile ? '58px' : '64px', paddingRight: '6px' }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px',
              borderLeft: '4px dashed var(--ink)', background: 'var(--paper)', color: 'var(--ink)',
              fontFamily: "'AnimeAce', sans-serif", fontSize: '10px',
            }}>
              <span aria-hidden>✎</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <b style={{ fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '1px' }}>EDITING</b> {maskSpoilers(editing.content)}
              </span>
              <button onClick={onCancelEdit} aria-label="Cancel editing" style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <CsmIcon name="close" size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* replying to: a strip of the quoted line above the balloon */}
      <AnimatePresence>
        {reply && !editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', paddingLeft: isMobile ? '58px' : '64px', paddingRight: '6px' }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px',
              borderLeft: '4px solid var(--ink)', background: 'var(--paper)', color: 'var(--ink)',
              fontFamily: "'AnimeAce', sans-serif", fontSize: '10px',
            }}>
              <CsmIcon name="reply" size={15} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <b style={{ fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '1px' }}>{reply.username}</b>{' '}
                {reply.type === 'image' ? '🖼 picture' : reply.type === 'audio' ? '🎤 voice' : maskSpoilers(reply.content)}
              </span>
              <button onClick={onCancelReply} aria-label="Cancel reply" style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <CsmIcon name="close" size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    padding: onAttach ? '11px 42px 11px 16px' : '11px 16px',
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
                  onSelect={(e) => { setCaret(e.currentTarget.selectionStart); setMentionOff(false); setPick(0) }}
                  aria-autocomplete="list"
                  aria-expanded={suggestions.length > 0}
                  onPaste={onAttach ? (e) => { const f = firstImage(e.clipboardData?.items); if (f) { e.preventDefault(); onAttach(f) } } : undefined}
                  placeholder={isMobile ? 'Your line…' : `Your line in ${roomName || 'the room'}…`}
                />
                {onAttach && (
                  <>
                    <input
                      ref={fileRef} type="file" accept="image/webp,image/jpeg,image/png,image/gif" hidden
                      onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onAttach(f) }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      title="Attach a picture (or paste / drop it)"
                      aria-label="Attach a picture"
                      style={{
                        position: 'absolute', right: '8px', bottom: '7px', width: '30px', height: '30px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', borderRadius: '8px', color: 'var(--ink)',
                        cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.4 : 0.75, padding: 0,
                      }}
                    >
                      {uploading
                        ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} style={{ display: 'flex' }}><CsmIcon name="settings" size={18} /></motion.span>
                        : <CsmIcon name="panel" size={20} />}
                    </motion.button>
                  </>
                )}
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

        {/* send: an ink SFX burst — "GO!!" — that slams in again every time you send */}
        <motion.button
          whileHover={hasText ? { scale: 1.06, rotate: -2 } : undefined}
          whileTap={{ scale: 0.88, rotate: -12 }}
          onClick={() => { if (!hasText) return; setBurstKey(k => k + 1); onSend() }}
          data-tour="send"
          aria-label="Send"
          title="Send"
          style={{
            position: 'relative', flexShrink: 0,
            width: isMobile ? '86px' : '108px', height: isMobile ? '52px' : '64px',
            margin: '-6px -4px -4px 0',
            padding: 0, border: 'none', borderRadius: 0, background: 'transparent',
            cursor: hasText ? 'pointer' : 'default',
            rotate: '-6deg',
          }}
        >
          <motion.span
            key={burstKey}
            initial={burstKey ? { scale: 1.35, rotate: -18 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 13 }}
            style={{ position: 'absolute', inset: 0, display: 'block' }}
          >
            <svg viewBox="0 0 120 70" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              <polygon
                points={BURST_POINTS}
                fill={hasText ? 'var(--ink)' : 'var(--paper)'}
                stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              paddingTop: '3px',
              fontFamily: "'DeathRattle', 'BlambotClassic', sans-serif",
              fontSize: isMobile ? '20px' : '25px', letterSpacing: '1px',
              color: hasText ? 'var(--paper)' : 'var(--ink)',
              opacity: hasText ? 1 : 0.55,
            }}>
              GO!!
            </span>
          </motion.span>
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
