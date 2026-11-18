import { useState } from 'react'
import { splitSpoilers } from '../lib/spoiler'

// one hidden part: rough ink hatching until clicked (or Enter / Space)
function Spoiler({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  if (open) {
    return <span style={{ background: 'color-mix(in srgb, var(--ink) 12%, transparent)', borderRadius: '3px', padding: '0 2px' }}>{text}</span>
  }
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="Spoiler — press to reveal"
      title="Spoiler — click to reveal"
      onClick={(e) => { e.stopPropagation(); setOpen(true) }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpen(true) } }}
      className="csm-spoiler"
    >
      {/* the text keeps its width but can't be read or selected */}
      <span aria-hidden style={{ visibility: 'hidden' }}>{text}</span>
    </span>
  )
}

// message text with ||spoilers||
export default function RichText({ text }: { text: string | null | undefined }) {
  const parts = splitSpoilers(text ?? '')
  if (parts.length === 1 && !parts[0]!.spoiler) return <>{text}</>
  return <>{parts.map((p, i) => (p.spoiler ? <Spoiler key={i} text={p.text} /> : <span key={i}>{p.text}</span>))}</>
}
