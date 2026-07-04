import React from 'react'
import { motion } from 'framer-motion'

// Reusing the same strict interface for settings structure
export interface Settings {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  sendOnEnter: boolean
  soundEnabled: boolean
  pochitaEnabled: boolean
  showTyping: boolean
}

interface FontLabelDetail {
  label: string
  desc: string
  px: string
}

// Strictly type the static font scaling labels configuration map
const FONT_LABELS: Record<Settings['fontSize'], FontLabelDetail> = {
  small: { label: 'А', desc: 'Small', px: '12px' },
  medium: { label: 'А', desc: 'Medium', px: '14px' },
  large: { label: 'А', desc: 'Large', px: '17px' },
}

interface ThemeOption {
  value: Settings['theme']
  label: string
}

// Strictly type the theme selector choices array
const THEME_OPTIONS: ThemeOption[] = [
  { value: 'system', label: '💻 System' },
  { value: 'light',  label: '☀️ Light'  },
  { value: 'dark',   label: '🌙 Dark'   },
]

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS PROPS INTERFACES

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  T: Record<string, string>
}

function Toggle({ checked, onChange, T }: ToggleProps) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '48px', height: '26px', borderRadius: '13px',
        background: checked ? '#cc2200' : T.inputBg,
        border: `2px solid ${T.inputBorder}`,
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          position: 'absolute', top: '2px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: checked ? '#fff' : T.inputBorder,
        }}
      />
    </div>
  )
}

interface SectionProps {
  title: string
  T: Record<string, string>
  children: React.ReactNode
}

function Section({ title, T, children }: SectionProps) {
  return (
    <div style={{ width: '100%', maxWidth: '480px' }}>
      <div style={{
        fontFamily: 'BlambotClassic, sans-serif',
        fontSize: '11px', letterSpacing: '3px',
        color: '#cc2200', marginBottom: '10px',
        borderBottom: `2px solid #cc2200`,
        paddingBottom: '4px',
        textTransform: 'uppercase',
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>
    </div>
  )
}

interface RowProps {
  label: string
  desc?: string
  T: Record<string, string>
  children: React.ReactNode
}

function Row({ label, desc, T, children }: RowProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      background: T.inputBg,
      border: `2px solid ${T.inputBorder}`,
      gap: '16px',
    }}>
      <div>
        <div style={{
          fontFamily: 'BlambotClassic, sans-serif',
          fontSize: 'var(--font-size-base, 14px)',
          color: T.titleColor, letterSpacing: '1px',
        }}>{label}</div>
        {desc && (
          <div style={{
            fontFamily: "'AnimeAce', sans-serif",
            fontSize: '11px', color: T.titleColor, opacity: 0.5,
            marginTop: '2px',
          }}>{desc}</div>
        )}
      </div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT EXPORT

interface SettingsTabProps {
  T: Record<string, string>
  settings: Settings
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

export default function SettingsTab({ T, settings, onUpdate }: SettingsTabProps) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '24px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px',
    }}>

      <div style={{
        fontFamily: 'BlambotClassic, sans-serif',
        fontSize: '22px', letterSpacing: '4px',
        color: T.titleColor,
        textShadow: '3px 3px 0 #cc2200',
      }}>
        ⚙️ SETTINGS
      </div>

      {/* THEME CONFIGURATION SECTION */}
      <Section title="interface theme" T={T}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {THEME_OPTIONS.map(opt => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdate('theme', opt.value)}
              style={{
                flex: 1, padding: '10px 8px',
                background: settings.theme === opt.value ? '#cc2200' : T.inputBg,
                color: settings.theme === opt.value ? '#fff' : T.titleColor,
                border: `2px solid ${settings.theme === opt.value ? '#cc2200' : T.inputBorder}`,
                fontFamily: "'AnimeAce', sans-serif",
                fontSize: '11px', cursor: 'pointer',
                letterSpacing: '0.5px',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      </Section>

      {/* FONT SIZE SELECTION SECTION */}
      <Section title="FONT SIZE" T={T}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(Object.keys(FONT_LABELS) as Array<keyof typeof FONT_LABELS>).map((key) => {
            const val = FONT_LABELS[key];
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => onUpdate('fontSize', key)}
                style={{
                  flex: 1, padding: '12px 8px',
                  background: settings.fontSize === key ? '#cc2200' : T.inputBg,
                  color: settings.fontSize === key ? '#fff' : T.titleColor,
                  border: `2px solid ${settings.fontSize === key ? '#cc2200' : T.inputBorder}`,
                  fontFamily: 'BlambotClassic, sans-serif',
                  fontSize: val.px,
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '4px',
                }}
              >
                <span>{val.label}</span>
                <span style={{ fontSize: '9px', fontFamily: "'AnimeAce', sans-serif", opacity: 0.8 }}>
                  {val.desc}
                </span>
              </motion.button>
            )
          })}
        </div>
      </Section>

      {/* CHAT INPUT SUBMISSION CONFIGURATION */}
      <Section title="SEND MESSAGES" T={T}>
        <Row
          label="Enter → send"
          desc={settings.sendOnEnter
            ? 'Ctrl+Enter — new line'
            : 'Ctrl+Enter — send, Enter — new line'}
          T={T}
        >
          <Toggle
            checked={settings.sendOnEnter}
            onChange={(v) => onUpdate('sendOnEnter', v)}
            T={T}
          />
        </Row>
      </Section>

      {/* MOTIONS & SOUND EFFECTS TOGGLES */}
      <Section title="SOUND" T={T}>
        <Row
          label="🪚 Chainsaw sounds"
          desc="Roar when CAPS LOCK is on and at startup"
          T={T}
        >
          <Toggle
            checked={settings.soundEnabled}
            onChange={(v) => onUpdate('soundEnabled', v)}
            T={T}
          />
        </Row>
      </Section>

      {/* POCHITA HEARTS EASTER EGG TOGGLE */}
      <Section title="EASTER EGGS" T={T}>
        <Row
          label="🐶 Pochita Hearts"
          desc="appears on cute words"
          T={T}
        >
          <Toggle
            checked={settings.pochitaEnabled ?? true}
            onChange={(v) => onUpdate('pochitaEnabled', v)}
            T={T}
          />
        </Row>
      </Section>

      {/* PRIVACY & BROADCAST CONFIGURATIONS */}
      <Section title="PRIVACY" T={T}>
        <Row
          label="⌨️ Show when I'm typing"
          desc={settings.showTyping ? 'Others can see your typing status' : 'Your typing status is hidden from others'}
          T={T}
        >
          <Toggle
            checked={settings.showTyping}
            onChange={(v) => onUpdate('showTyping', v)}
            T={T}
          />
        </Row>
      </Section>

    </div>
  )
}