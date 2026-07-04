interface DateDividerProps {
  label: string
  theme: 'dark' | 'light' | string
}

export default function DateDivider({ label, theme }: DateDividerProps) {
  const color = theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '8px 0', userSelect: 'none',
    }}>
      <div style={{ flex: 1, height: '1px', background: color }} />
      <span style={{
        fontFamily: "'AnimeAce', sans-serif",
        fontSize: '10px', letterSpacing: '2px',
        color,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: color }} />
    </div>
  )
}