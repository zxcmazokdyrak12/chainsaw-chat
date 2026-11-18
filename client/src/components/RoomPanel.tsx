import { useEffect, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import CsmIcon from './CsmIcon'
import { useT } from '../lib/i18n'

export interface Member { username: string; online: boolean }

// the chapter's cast list: who's in it, its code, and — for whoever started it — rename / kick / delete
export default function RoomPanel({ roomId, name, code, createdBy, me, members, onRename, onKick, onLeave, onDelete, onClose }: {
  roomId: string
  name: string
  code: string | null
  createdBy: string | null
  me: string
  members: Member[]
  onRename: (name: string) => void
  onKick: (username: string) => void
  onLeave: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const t = useT()
  const lobby = roomId === 'general'
  const owner = !lobby && createdBy === me
  const [title, setTitle] = useState(name.replace(/^#\s*/, ''))
  const [confirm, setConfirm] = useState<'' | 'leave' | 'delete' | string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const btn = (danger = false): CSSProperties => ({
    padding: '6px 10px', cursor: 'pointer', fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '1px', fontSize: '12px',
    background: danger ? 'var(--blood)' : 'transparent', color: danger ? '#fff' : 'var(--ink)', border: `2px solid ${danger ? 'var(--blood)' : 'var(--ink)'}`,
  })
  const online = members.filter(m => m.online).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9600, background: 'rgba(10,10,10,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
      <motion.div
        role="dialog" aria-modal="true" aria-labelledby="room-title"
        initial={{ scale: 0.95, rotate: 1 }} animate={{ scale: 1, rotate: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(420px, 100%)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px',
          background: 'var(--paper)', color: 'var(--ink)', border: '4px solid var(--ink)', boxShadow: '8px 8px 0 var(--ink)',
          padding: '16px 18px', fontFamily: "'AnimeAce', sans-serif", fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--ink)', paddingBottom: '6px' }}>
          <h2 id="room-title" style={{ margin: 0, fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '2px', fontSize: '18px' }}>{name}</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer' }}><CsmIcon name="close" size={20} /></button>
        </div>

        {owner && (
          <form onSubmit={e => { e.preventDefault(); if (title.trim()) onRename(title.trim()) }} style={{ display: 'flex', gap: '8px' }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ opacity: 0.7 }}>{t('Chapter title')}</span>
              <input value={title} maxLength={16} onChange={e => setTitle(e.target.value.toUpperCase())}
                style={{ border: '2px solid var(--ink)', background: 'transparent', color: 'var(--ink)', padding: '6px 8px', fontFamily: 'inherit', fontSize: '12px' }} />
            </label>
            <button type="submit" style={{ ...btn(), alignSelf: 'flex-end' }}>{t('RENAME')}</button>
          </form>
        )}

        {code && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ opacity: 0.7 }}>{t('Invite code')}</span>
            <code style={{ fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '3px', fontSize: '15px', border: '2px dashed var(--ink)', padding: '2px 8px' }}>{code}</code>
            <button onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) }} style={btn()}>
              {copied ? t('COPIED') : t('COPY')}
            </button>
          </div>
        )}

        <div>
          <div style={{ marginBottom: '6px', fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '1px', fontSize: '13px' }}>
            {t('CAST')} · {members.length} <span style={{ opacity: 0.6, fontFamily: "'AnimeAce', sans-serif", fontSize: '10px' }}>{t('({n} online)', { n: online })}</span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {members.map(m => (
              <li key={m.username} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', border: '1.5px solid var(--ink)' }}>
                <span aria-label={m.online ? 'online' : 'offline'} style={{ width: 9, height: 9, borderRadius: '50%', border: '2px solid var(--ink)', background: m.online ? 'var(--ink)' : 'transparent' }} />
                <span style={{ flex: 1 }}>
                  {m.username}
                  {m.username === createdBy && <span style={{ marginLeft: 6, opacity: 0.6 }}>· {t('founder')}</span>}
                  {m.username === me && <span style={{ marginLeft: 6, opacity: 0.6 }}>· {t('you')}</span>}
                </span>
                {owner && m.username !== me && (
                  confirm === `kick:${m.username}`
                    ? <button onClick={() => { onKick(m.username); setConfirm('') }} style={btn(true)}>{t('SURE?')}</button>
                    : <button onClick={() => setConfirm(`kick:${m.username}`)} style={btn()} aria-label={`Kick ${m.username}`}>{t('KICK')}</button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {!lobby && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '2px solid var(--ink)', paddingTop: '10px' }}>
            {confirm === 'leave'
              ? <button onClick={onLeave} style={btn(true)}>{t('LEAVE FOR GOOD?')}</button>
              : <button onClick={() => setConfirm('leave')} style={btn()}>{t('LEAVE')}</button>}
            {owner && (confirm === 'delete'
              ? <button onClick={onDelete} style={btn(true)}>{t('BURN IT ALL?')}</button>
              : <button onClick={() => setConfirm('delete')} style={btn()}>{t('DELETE CHAPTER')}</button>)}
          </div>
        )}
        {lobby && <p style={{ margin: 0, opacity: 0.6 }}>{t("The lobby is open to everyone; you can't leave or delete it.")}</p>}
      </motion.div>
    </motion.div>
  )
}
