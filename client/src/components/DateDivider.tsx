interface DateDividerProps {
  label: string
  theme: 'dark' | 'light' | string
}

// a date reads like a chapter break: ink rule, label in a tone-filled tab
export default function DateDivider({ label }: DateDividerProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 0', userSelect: 'none',
    }}>
      <div style={{ flex: 1, height: '3px', background: 'var(--ink)' }} />
      <span className="tone-light" style={{
        fontFamily: 'BlambotClassic, sans-serif',
        fontSize: '13px', letterSpacing: '3px',
        color: 'var(--ink)', whiteSpace: 'nowrap',
        border: '3px solid var(--ink)', borderRadius: '999px',
        padding: '2px 4px', backgroundColor: 'var(--paper)',
      }}>
        <span style={{ backgroundColor: 'var(--paper)', padding: '0 8px', borderRadius: '999px' }}>{label}</span>
      </span>
      <div style={{ flex: 1, height: '3px', background: 'var(--ink)' }} />
    </div>
  )
}
