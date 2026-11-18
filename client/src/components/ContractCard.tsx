import { motion } from 'framer-motion'
import RichText from './RichText'
import { useT } from '../lib/i18n'

export interface PollData {
  kind: 'contract' | 'poll'
  title: string
  options: { id: string; label: string }[]
  votes: Record<string, string[]>
  closed: boolean
}

// a devil contract / a vote: a scroll with seal slots. Your seal is the red one.
export default function ContractCard({ poll, me, isAuthor, onVote, onClose }: {
  poll: PollData
  me: string
  isAuthor: boolean
  onVote: (optionId: string) => void
  onClose: () => void
}) {
  const t = useT()
  const total = Object.values(poll.votes).reduce((n, l) => n + l.length, 0)
  const contract = poll.kind === 'contract'

  return (
    <div
      role="group"
      aria-label={`${contract ? 'Contract' : 'Vote'}: ${poll.title}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        minWidth: '220px', maxWidth: '300px', textAlign: 'left',
        background: 'var(--paper)', color: 'var(--ink)',
        border: '3px double var(--ink)', outline: '2px solid var(--ink)', outlineOffset: '3px',
        padding: '12px 14px', margin: '4px', fontFamily: "'AnimeAce', sans-serif",
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', borderBottom: '2px solid var(--ink)', paddingBottom: '4px', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '2px', fontSize: '13px' }}>
          {contract ? t('CONTRACT 契約') : t('VOTE 投票')}
        </span>
        <span style={{ fontSize: '9px', opacity: 0.6 }}>{poll.closed ? t('SEALED') : t(total === 1 ? '{n} seal' : '{n} seals', { n: total })}</span>
      </div>

      <div style={{ fontSize: '12px', lineHeight: 1.5, marginBottom: '10px' }}><RichText text={poll.title} /></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {poll.options.map(o => {
          const voters = poll.votes[o.id] ?? []
          const mine = voters.includes(me)
          const share = total ? voters.length / total : 0
          return (
            <motion.button
              key={o.id}
              whileTap={poll.closed ? undefined : { scale: 0.96 }}
              disabled={poll.closed}
              onClick={() => onVote(o.id)}
              aria-pressed={mine}
              title={voters.length ? voters.join(', ') : 'No seals yet'}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '6px 8px', textAlign: 'left', overflow: 'hidden',
                background: 'transparent', color: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: '4px',
                cursor: poll.closed ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: '11px',
              }}
            >
              {/* how many sealed it — a screentone bar */}
              {!contract && <span aria-hidden className="tone" style={{ position: 'absolute', inset: 0, width: `${share * 100}%`, opacity: 0.35, transition: 'width .3s' }} />}
              <span aria-hidden style={{
                position: 'relative', flexShrink: 0, width: '26px', height: '26px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px ${mine ? 'solid' : 'dashed'} ${mine ? 'var(--blood)' : 'var(--ink)'}`,
                background: mine ? 'var(--blood)' : 'transparent', color: '#fff',
                fontFamily: 'serif', fontWeight: 900, fontSize: '14px',
                transform: mine ? 'rotate(-12deg)' : undefined,
              }}>
                {mine ? '契' : ''}
              </span>
              <span style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <b style={{ fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '1px' }}>{contract ? (mine ? t('SIGNED') : t('SIGN IN BLOOD')) : o.label}</b>
                {voters.length > 0 && (
                  <span style={{ display: 'block', fontSize: '9px', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {voters.join(' · ')}
                  </span>
                )}
              </span>
              {!contract && <span style={{ position: 'relative', fontFamily: 'BlambotClassic, sans-serif' }}>{voters.length}</span>}
            </motion.button>
          )
        })}
      </div>

      {isAuthor && !poll.closed && (
        <button onClick={onClose} style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--ink)', fontFamily: 'inherit', fontSize: '9px', textDecoration: 'underline', cursor: 'pointer', padding: 0, opacity: 0.7 }}>
          {contract ? t('close the contract') : t('close the vote')}
        </button>
      )}
    </div>
  )
}
