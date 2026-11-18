import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import CsmIcon from './CsmIcon'
import { rankOf, saveCharacterPage, type CharacterFields, type ProfileStats } from '../profileData'

// "Character page" like the extras at the back of a manga volume:
// a big portrait and a few fields the user fills in about themselves.

const ink = 'var(--ink)'
const paper = 'var(--paper)'

const FIELDS: { key: keyof CharacterFields; label: string; hint: string }[] = [
  { key: 'contract',   label: 'CONTRACT DEVIL', hint: 'Chainsaw Devil' },
  { key: 'likes',      label: 'LIKES',          hint: 'bread with jam' },
  { key: 'dislikes',   label: 'DISLIKES',       hint: 'debt, mornings' },
  { key: 'dream',      label: 'DREAM',          hint: 'a normal life' },
  { key: 'favChapter', label: 'FAV CHAPTER',    hint: '# GENERAL' },
]

interface CharacterPageProps {
  username: string
  avatarSrc: string | null
  page: CharacterFields
  stats?: ProfileStats | null
  editable?: boolean
  compact?: boolean
  onSaved?: (page: CharacterFields) => void
}

export default function CharacterPage({ username, avatarSrc, page, stats, editable, compact, onSaved }: CharacterPageProps) {
  const [draft, setDraft] = useState<CharacterFields>(page)
  const [status, setStatus] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)
  useEffect(() => { setDraft(page) }, [page])

  const loggedIn = (() => { try { return !!localStorage.getItem('token') } catch { return false } })()
  const canEdit = !!editable && loggedIn
  const dirty = FIELDS.some(f => draft[f.key] !== page[f.key])
  const rank = stats ? rankOf(stats.lines) : null

  const save = async () => {
    setSaving(true); setStatus('')
    const r = await saveCharacterPage(draft)
    setSaving(false)
    setStatus(r.ok ? 'SAVED' : (r.error ?? 'Could not save'))
    if (r.ok) onSaved?.(draft)
  }

  return (
    <div style={{
      position: 'relative',
      border: `3px solid ${ink}`, borderRadius: '6px', backgroundColor: paper, color: ink,
      padding: compact ? '14px' : '18px',
      display: 'grid', gridTemplateColumns: compact ? '110px 1fr' : 'minmax(120px, 170px) 1fr', gap: compact ? '12px' : '18px',
    }}>
      {/* caption box over the top border */}
      <div style={{
        position: 'absolute', top: '-15px', left: '14px',
        display: 'flex', alignItems: 'center', gap: '6px',
        border: `3px solid ${ink}`, backgroundColor: paper, padding: '2px 10px',
        transform: 'rotate(-1.5deg)', boxShadow: `3px 3px 0 ${ink}`,
        fontFamily: 'BlambotClassic, sans-serif', fontSize: '14px', letterSpacing: '2px',
      }}>
        <CsmIcon name="book" size={15} strokeWidth={2.4} /> CHARACTER PAGE
      </div>

      <div>
        <div style={{ border: `3px solid ${ink}`, aspectRatio: '3 / 4', overflow: 'hidden', backgroundColor: paper }} className="tone-light">
          {avatarSrc && (
            <img src={avatarSrc} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(1) contrast(1.15)' }} />
          )}
        </div>
        <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '9px', opacity: 0.55, textAlign: 'center', marginTop: '5px' }}>
          volume extras
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: compact ? '30px' : '38px', letterSpacing: '3px', lineHeight: 1, wordBreak: 'break-word' }}>
          {username}
        </div>
        {rank && (
          <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', letterSpacing: '1px', marginTop: '4px' }}>
            {rank.title} · {stats?.lines ?? 0} lines
          </div>
        )}

        <div style={{ marginTop: '8px' }}>
          {FIELDS.map(f => (
            <div key={f.key} style={{ borderBottom: `2px solid ${ink}`, padding: '6px 0' }}>
              <div style={{ fontFamily: "'AnimeAce', sans-serif", fontWeight: 900, fontSize: '9px', letterSpacing: '1px' }}>{f.label}</div>
              {canEdit ? (
                <input
                  value={draft[f.key]}
                  maxLength={40}
                  placeholder={f.hint}
                  onChange={e => { setDraft(d => ({ ...d, [f.key]: e.target.value })); setStatus('') }}
                  aria-label={f.label}
                  style={{
                    width: '100%', boxSizing: 'border-box', marginTop: '2px',
                    border: 'none', borderRadius: 0, background: 'transparent', outline: 'none',
                    color: ink, fontFamily: "'AnimeAce', sans-serif", fontSize: compact ? '13px' : '15px', padding: '2px 0',
                  }}
                />
              ) : (
                <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: compact ? '13px' : '15px', marginTop: '2px', opacity: page[f.key] ? 1 : 0.4 }}>
                  {page[f.key] || '— not filled in —'}
                </div>
              )}
            </div>
          ))}
        </div>

        {editable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            {canEdit ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={save}
                  disabled={!dirty || saving}
                  style={{
                    padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '8px',
                    background: dirty ? 'var(--accent)' : paper, color: dirty ? 'var(--on-accent)' : ink,
                    border: `3px solid ${ink}`, borderRadius: '12px',
                    boxShadow: dirty ? `3px 3px 0 ${ink}` : 'none', opacity: dirty ? 1 : 0.55,
                    fontFamily: 'BlambotClassic, sans-serif', fontSize: '15px', letterSpacing: '2px',
                    cursor: dirty ? 'pointer' : 'default',
                  }}
                >
                  <CsmIcon name="edit" size={16} /> {saving ? '...' : 'SAVE PAGE'}
                </motion.button>
                {status && <span style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '11px' }}>{status === 'SAVED' ? '✓ saved' : `✕ ${status}`}</span>}
              </>
            ) : (
              <span style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '11px', opacity: 0.7 }}>
                Log in with a nickname + password (or Google / GitHub) to fill in your page.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
