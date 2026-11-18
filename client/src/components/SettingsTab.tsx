import React from 'react'
import { motion } from 'framer-motion'
import { enablePush, disablePush, pushSupported } from '../lib/push'
import { getAccountToken } from '../lib/auth'
import CsmIcon, { type CsmIconName } from './CsmIcon'
import { useT, LANGS, setLang, getLang } from '../lib/i18n'

// Reusing the same strict interface for settings structure
export interface Settings {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  sendOnEnter: boolean
  soundEnabled: boolean
  pochitaEnabled: boolean
  showTyping: boolean
  stickerBomb: 'off' | 'light' | 'full'
  sfxEnabled: boolean
  desktopNotify: boolean
  berserk: boolean
  push: boolean
}

interface SettingsTabProps {
  T: Record<string, string>
  settings: Settings
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onReplayTutorial?: () => void
}

const ink = 'var(--ink)'
const paper = 'var(--paper)'

// ── building blocks ──────────────────────────────────────────────

// a panel with a narration caption stuck over its top-left border
function Panel({ title, icon, children, wide }: { title: string; icon: CsmIconName; children: React.ReactNode; wide?: boolean }) {
  return (
    <section style={{
      position: 'relative', gridColumn: wide ? '1 / -1' : undefined,
      border: `3px solid ${ink}`, borderRadius: '12px',
      padding: '26px 16px 16px', marginTop: '14px',
      backgroundColor: paper,
    }}>
      <div style={{
        position: 'absolute', top: '-15px', left: '14px',
        display: 'flex', alignItems: 'center', gap: '7px',
        border: `3px solid ${ink}`, backgroundColor: paper, color: ink,
        padding: '3px 12px 3px 9px', transform: 'rotate(-1.5deg)',
        boxShadow: `3px 3px 0 ${ink}`,
        fontFamily: 'BlambotClassic, sans-serif', fontSize: '15px', letterSpacing: '2px',
      }}>
        <CsmIcon name={icon} size={17} strokeWidth={2.4} />
        {title}
      </div>
      {children}
    </section>
  )
}

// on/off switch that reads like an ink stamp
function Stamp({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useT()
  return (
    <button
      role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', flexShrink: 0,
        width: '70px', height: '32px', padding: 0,
        border: `3px solid ${ink}`, borderRadius: '999px',
        backgroundColor: checked ? ink : paper,
        cursor: 'pointer',
      }}
    >
      <span style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        [checked ? 'left' : 'right']: '9px',
        fontFamily: 'BlambotClassic, sans-serif', fontSize: '12px', letterSpacing: '1px',
        color: checked ? paper : ink, opacity: 0.85,
      } as React.CSSProperties}>
        {checked ? t('ON') : t('OFF')}
      </span>
      <motion.span
        animate={{ x: checked ? 38 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        style={{
          position: 'absolute', top: '2px', left: '2px',
          width: '22px', height: '22px', borderRadius: '50%',
          backgroundColor: checked ? paper : ink,
        }}
      />
    </button>
  )
}

function Row({ icon, label, desc, children }: { icon: CsmIconName; label: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 2px', borderBottom: `2px dotted ${ink}`,
    }}>
      <CsmIcon name={icon} size={24} strokeWidth={2.2} style={{ color: ink }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '16px', letterSpacing: '1.5px', color: ink }}>{label}</div>
        <div style={{ fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', color: ink, opacity: 0.6, marginTop: '2px' }}>{desc}</div>
      </div>
      {children}
    </div>
  )
}

// a choice tile: a mini preview + caption, selected = thick frame and a check stamp
function Tile({ selected, onClick, caption, children }: { selected: boolean; onClick: () => void; caption: string; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-pressed={selected}
      style={{
        position: 'relative', flex: 1, minWidth: 0,
        padding: '8px 8px 6px',
        backgroundColor: paper, color: ink,
        border: `${selected ? 4 : 2}px solid ${ink}`, borderRadius: '12px',
        boxShadow: selected ? `4px 4px 0 ${ink}` : 'none',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '6px',
      }}
    >
      {children}
      <span style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '13px', letterSpacing: '1.5px', textAlign: 'center' }}>{caption}</span>
      {selected && (
        <span style={{
          position: 'absolute', top: '-10px', right: '-8px',
          width: '24px', height: '24px', borderRadius: '50%',
          backgroundColor: ink, color: paper,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', transform: 'rotate(-10deg)',
        }}>✓</span>
      )}
    </motion.button>
  )
}

// tiny page previews for the theme picker
function PagePreview({ mode }: { mode: 'light' | 'dark' | 'system' }) {
  const half = (bg: string, fg: string) => (
    <div style={{ flex: 1, background: bg, padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ height: '9px', width: '70%', border: `2px solid ${fg}`, borderRadius: '6px' }} />
      <div style={{ height: '9px', width: '55%', border: `2px solid ${fg}`, borderRadius: '6px', alignSelf: 'flex-end', backgroundImage: `radial-gradient(${fg} .6px, transparent 1px)`, backgroundSize: '4px 4px' }} />
      <div style={{ height: '3px', width: '80%', background: fg }} />
    </div>
  )
  return (
    <div style={{ display: 'flex', height: '54px', border: `2px solid ${ink}`, borderRadius: '6px', overflow: 'hidden' }}>
      {mode !== 'dark' && half('#f5f2ea', '#111')}
      {mode !== 'light' && half('#0e0e0e', '#f2efe6')}
    </div>
  )
}

// sticker density preview: little rotated squares
function BombPreview({ level }: { level: 'off' | 'light' | 'full' }) {
  const t = useT()
  const spots = level === 'off' ? [] : level === 'light'
    ? [[6, 8, -12], [70, 30, 14], [14, 62, 8]]
    : [[4, 6, -12], [38, 14, 10], [72, 4, -6], [10, 46, 16], [52, 40, -14], [80, 52, 9], [28, 70, -4], [64, 72, 12]]
  return (
    <div className={level === 'off' ? undefined : 'tone-light'} style={{ position: 'relative', height: '54px', border: `2px solid ${ink}`, borderRadius: '6px', overflow: 'hidden', backgroundColor: paper }}>
      {spots.map(([x, y, r], i) => (
        <span key={i} style={{
          position: 'absolute', left: `${x}%`, top: `${y}%`, width: '15px', height: '15px',
          background: paper, border: `2px solid ${ink}`, borderRadius: '3px',
          transform: `rotate(${r}deg)`, boxShadow: `1px 1px 0 ${ink}`,
        }} />
      ))}
      {level === 'off' && (
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'AnimeAce', sans-serif", fontSize: '10px', opacity: 0.5 }}>{t('clean page')}</span>
      )}
    </div>
  )
}

const FONT_PX: Record<Settings['fontSize'], string> = { small: '12px', medium: '14px', large: '17px' }

// ── the tab ──────────────────────────────────────────────────────

export default function SettingsTab({ settings, onUpdate, onReplayTutorial }: SettingsTabProps) {
  const t = useT()
  const lang = getLang()
  const [pushNote, setPushNote] = React.useState('')
  const bomb = settings.stickerBomb ?? 'light'

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 34px', color: ink }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>

        {/* title */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', marginBottom: '6px' }}>
          <div style={{ fontFamily: 'BlambotClassic, sans-serif', fontSize: '40px', letterSpacing: '6px', lineHeight: 1 }}>{t('SETTINGS')}</div>
          <div style={{ fontFamily: 'serif', fontSize: '18px', opacity: 0.55, paddingBottom: '4px' }}>設定</div>
        </div>
        <div style={{ height: '4px', background: ink, marginBottom: '3px' }} />
        <div style={{ height: '1.5px', background: ink, marginBottom: '14px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', columnGap: '18px', rowGap: '14px' }}>

          <Panel title={t("PAGE")} icon={settings.theme === 'dark' ? 'moon' : 'sun'} wide>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(['system', 'light', 'dark'] as const).map(m => (
                <Tile key={m} selected={settings.theme === m} onClick={() => onUpdate('theme', m)}
                  caption={m === 'system' ? t('SYSTEM') : m === 'light' ? t('PAPER') : t('NEGATIVE')}>
                  <PagePreview mode={m} />
                </Tile>
              ))}
            </div>
          </Panel>

          <Panel title={t("LANGUAGE")} icon="chat" wide>
            <div role="radiogroup" aria-label={t('LANGUAGE')} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {LANGS.map(l => (
                <button key={l.id} role="radio" aria-checked={lang === l.id} onClick={() => setLang(l.id)}
                  style={{
                    padding: '8px 16px', cursor: 'pointer', fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '2px', fontSize: '14px',
                    background: lang === l.id ? 'var(--ink)' : 'transparent', color: lang === l.id ? 'var(--paper)' : 'var(--ink)', border: '3px solid var(--ink)',
                  }}>
                  {l.label}
                </button>
              ))}
            </div>
          </Panel>
          <Panel title={t("LETTERING")} icon="chat">
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['small', 'medium', 'large'] as const).map(sz => (
                <Tile key={sz} selected={settings.fontSize === sz} onClick={() => onUpdate('fontSize', sz)} caption={t(sz.toUpperCase())}>
                  <div style={{ height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{
                      border: `2px solid ${ink}`, borderRadius: '50% / 50%', padding: '6px 10px',
                      fontFamily: "'AnimeAce', sans-serif", fontSize: FONT_PX[sz],
                    }}>Aa</span>
                  </div>
                </Tile>
              ))}
            </div>
          </Panel>

          <Panel title={t("STICKERBOMB")} icon="sfx">
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['off', 'light', 'full'] as const).map(lv => (
                <Tile key={lv} selected={bomb === lv} onClick={() => onUpdate('stickerBomb', lv)} caption={t(lv.toUpperCase())}>
                  <BombPreview level={lv} />
                </Tile>
              ))}
            </div>
          </Panel>

          <Panel title={t("SOUND & FX")} icon="chainsaw">
            <Row icon="chainsaw" label={t("CHAINSAW SOUNDS")} desc={t("roar at startup and on CAPS LOCK")}>
              <Stamp label="Chainsaw sounds" checked={settings.soundEnabled} onChange={v => onUpdate('soundEnabled', v)} />
            </Row>
            <Row icon="sfx" label={t("MANGA SFX")} desc={t("DOOOM on caps, DON on send, ZAP! on join")}>
              <Stamp label="Manga SFX" checked={settings.sfxEnabled ?? true} onChange={v => onUpdate('sfxEnabled', v)} />
            </Row>
            <Row icon="chainsaw" label={t("BERSERK MODE")} desc={t("message bursts rev a tachometer in the corner")}>
              <Stamp label="Berserk mode" checked={settings.berserk ?? true} onChange={v => onUpdate('berserk', v)} />
            </Row>
            <Row icon="heart" label={t("POCHITA HEARTS")} desc={t("hearts rain on cute words")}>
              <Stamp label="Pochita hearts" checked={settings.pochitaEnabled ?? true} onChange={v => onUpdate('pochitaEnabled', v)} />
            </Row>
          </Panel>

          <Panel title={t("CONTROLS & PRIVACY")} icon="keyboard">
            <Row icon="send" label={t("ENTER SENDS")}
              desc={settings.sendOnEnter ? t('Shift+Enter — new line') : t('Ctrl+Enter sends, Enter — new line')}>
              <Stamp label="Enter sends" checked={settings.sendOnEnter} onChange={v => onUpdate('sendOnEnter', v)} />
            </Row>
            <Row icon="keyboard" label={t("SHOW I'M TYPING")}
              desc={settings.showTyping ? t('others see your thought balloon') : t('you type in secret')}>
              <Stamp label="Show typing" checked={settings.showTyping} onChange={v => onUpdate('showTyping', v)} />
            </Row>
            <Row icon="bell" label={t("PUSH WHEN CLOSED")}
              desc={!getAccountToken() ? t('needs an account (guests vanish with the tab)') : !pushSupported() ? t('not in this browser — on iPhone add the app to the Home Screen') : t(pushNote || 'a ping on your phone even with the app closed')}>
              <Stamp label="Push when closed" checked={settings.push ?? false} onChange={async v => {
                if (!v) { await disablePush(); onUpdate('push', false); setPushNote(''); return }
                if (!getAccountToken()) { setPushNote('sign in with an account first'); return }
                const err = await enablePush().catch(() => 'Could not subscribe')
                setPushNote(err ?? 'on — try it: close the tab and ask a friend to write')
                if (!err) onUpdate('push', true)
              }} />
            </Row>
            <Row icon="bell" label={t("BACKGROUND ALERTS")}
              desc={settings.desktopNotify ? t('a notification when the tab is hidden') : t('only the (3) counter on the tab')}>
              <Stamp label="Background alerts" checked={settings.desktopNotify ?? false} onChange={async v => {
                if (v && 'Notification' in window && Notification.permission !== 'granted') {
                  const ok = await Notification.requestPermission().catch(() => 'denied')
                  if (ok !== 'granted') return
                }
                onUpdate('desktopNotify', v)
              }} />
            </Row>
          </Panel>

          {onReplayTutorial && (
            <Panel title={t("TOUR")} icon="book" wide>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', fontFamily: "'AnimeAce', sans-serif", fontSize: '11px', lineHeight: 1.6 }}>
                  Forgot where things are? The crew will walk you through the chat again.
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onReplayTutorial}
                  style={{
                    padding: '12px 22px', display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'var(--accent)', color: 'var(--on-accent)',
                    border: `3px solid ${ink}`, borderRadius: '12px', boxShadow: `4px 4px 0 ${ink}`,
                    fontFamily: 'BlambotClassic, sans-serif', fontSize: '16px', letterSpacing: '2px', cursor: 'pointer',
                  }}
                >
                  <CsmIcon name="book" size={20} /> REPLAY THE TOUR
                </motion.button>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
