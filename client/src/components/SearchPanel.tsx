import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { socket } from '../lib/socket'
import CsmIcon from './CsmIcon'

export interface SearchHit { id: number; username: string | null; content: string | null; time: string | null; at: string; type: string }

// search inside the current room (server side, so older messages are found too)
export default function SearchPanel({ roomId, roomName, onJump, onClose }: {
  roomId: string
  roomName: string
  onJump: (hit: SearchHit) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const latest = useRef('')

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    const onResults = ({ q: forQ, results }: { q: string; results: SearchHit[] }) => {
      if (forQ === latest.current) setHits(results)
    }
    socket.on('search_results', onResults)
    return () => { socket.off('search_results', onResults) }
  }, [])
  useEffect(() => {
    const term = q.trim()
    latest.current = term
    if (term.length < 2) { setHits(null); return }
    const t = setTimeout(() => socket.emit('search_messages', { roomId, q: term }), 280)
    return () => clearTimeout(t)
  }, [q, roomId])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // the matching part of a line, inked over
  const mark = (text: string) => {
    const term = latest.current
    const i = text.toLowerCase().indexOf(term.toLowerCase())
    if (i < 0 || !term) return text
    return <>{text.slice(0, i)}<mark style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '0 2px' }}>{text.slice(i, i + term.length)}</mark>{text.slice(i + term.length)}</>
  }

  return (
    <motion.div
      role="dialog" aria-label="Search messages"
      initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'absolute', top: '8px', left: '50%', x: '-50%', zIndex: 40,
        width: 'min(520px, calc(100% - 16px))', maxHeight: '70%', display: 'flex', flexDirection: 'column',
        background: 'var(--paper)', color: 'var(--ink)', border: '3px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)',
        fontFamily: "'AnimeAce', sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderBottom: '3px solid var(--ink)' }}>
        <CsmIcon name="search" size={20} />
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          maxLength={64}
          placeholder={`Search in ${roomName || 'this room'}…`}
          aria-label="Search text"
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit', fontSize: '13px' }}
        />
        <button onClick={onClose} aria-label="Close search" style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer', padding: 2 }}>
          <CsmIcon name="close" size={18} />
        </button>
      </div>
      <div style={{ overflowY: 'auto', fontSize: '11px' }}>
        {hits === null && <p style={{ margin: 0, padding: '12px', opacity: 0.55 }}>Type 2+ letters.</p>}
        {hits?.length === 0 && <p style={{ margin: 0, padding: '12px', opacity: 0.55 }}>Nothing. Maybe the devil ate it.</p>}
        {hits?.map(h => (
          <button
            key={h.id}
            onClick={() => onJump(h)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
              background: 'transparent', color: 'var(--ink)', border: 'none', borderBottom: '1px dashed var(--ink)',
              padding: '8px 12px', fontFamily: 'inherit', fontSize: '11px', lineHeight: 1.5,
            }}
          >
            <span style={{ fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '1px' }}>{h.username}</span>
            <span style={{ opacity: 0.5 }}> · {new Date(h.at).toLocaleDateString()} {h.time}</span>
            <br />
            {h.type === 'image' && '🖼 '}{mark(h.content ?? '')}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
