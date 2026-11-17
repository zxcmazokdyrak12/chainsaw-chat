import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CharacterPage from './CharacterPage'
import { fetchProfile, EMPTY_PAGE, type ProfileData } from '../profileData'

// Tapping someone's avatar in the chat opens their character page.

interface CharacterModalProps {
  username: string | null
  fallbackAvatar?: string | null
  onClose: () => void
}

export default function CharacterModal({ username, fallbackAvatar, onClose }: CharacterModalProps) {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!username) return
    let alive = true
    setData(null); setLoading(true)
    fetchProfile(username).then(p => { if (alive) { setData(p); setLoading(false) } })
    return () => { alive = false }
  }, [username])

  useEffect(() => {
    if (!username) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [username, onClose])

  return (
    <AnimatePresence>
      {username && (
        <motion.div
          key="char-modal"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="tone"
          role="dialog" aria-modal aria-label={`${username}'s character page`}
          style={{
            position: 'fixed', inset: 0, zIndex: 900,
            backgroundColor: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <motion.div
            initial={{ y: 30, rotate: -3, opacity: 0 }}
            animate={{ y: 0, rotate: -1, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '460px', position: 'relative', paddingTop: '16px' }}
          >
            <CharacterPage
              username={username}
              avatarSrc={data?.avatar ?? fallbackAvatar ?? null}
              page={data?.page ?? EMPTY_PAGE}
              stats={data?.stats ?? null}
              compact
            />
            {loading && (
              <div style={{ position: 'absolute', right: '14px', top: '28px', fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', color: 'var(--ink)' }}>
                loading…
              </div>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: 'absolute', top: '2px', right: '-8px',
                width: '34px', height: '34px', padding: 0, borderRadius: '50%',
                backgroundColor: 'var(--ink)', color: 'var(--paper)', border: '3px solid var(--paper)',
                fontSize: '16px', cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
