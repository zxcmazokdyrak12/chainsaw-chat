import { useEffect, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { renderMangaPages, PAGE_W, PAGE_H } from '../lib/mangaPage'
import { jpegPagesToPdf } from '../lib/pdf'
import type { MessageItem } from '../chatTypes'
import CsmIcon from './CsmIcon'

type Scope = 'recent' | 'all'
const RECENT = 12

const download = (blob: Blob, name: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}
const toBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('export failed'))), type, q))

// "SAVE CHAPTER": preview the manga page(s), then PNG (one page) or PDF (all pages)
export default function ExportDialog({ messages, roomName, chapter, me, onClose }: {
  messages: MessageItem[]
  roomName: string
  chapter: number
  me: string
  onClose: () => void
}) {
  const [scope, setScope] = useState<Scope>('recent')
  const [pages, setPages] = useState<HTMLCanvasElement[] | null>(null)
  const [preview, setPreview] = useState<string[]>([])
  const [at, setAt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const real = messages.filter(m => !m.system)
  useEffect(() => {
    let alive = true
    setPages(null); setAt(0); setError('')
    const list = scope === 'recent' ? real.slice(-RECENT) : real
    renderMangaPages({ messages: list, roomName, chapter, me })
      .then(cs => {
        if (!alive) return
        setPages(cs)
        try { setPreview(cs.map(c => c.toDataURL('image/jpeg', 0.6))) } catch { setError("A picture from another site blocked the export. Try 'last 12 lines'.") }
      })
      .catch(() => alive && setError('Could not draw the page'))
    return () => { alive = false }
  }, [scope]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setAt(a => Math.min(a + 1, (pages?.length ?? 1) - 1))
      if (e.key === 'ArrowLeft') setAt(a => Math.max(a - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, pages])

  const base = `chainsaw-chat_ch${chapter}_${roomName.replace(/[^\w-]+/g, '').toLowerCase() || 'room'}`
  const savePng = async () => {
    if (!pages) return
    setBusy(true)
    try { download(await toBlob(pages[at]!, 'image/png'), `${base}_p${at + 1}.png`) } catch { setError('Export failed') }
    setBusy(false)
  }
  const savePdf = async () => {
    if (!pages) return
    setBusy(true)
    try {
      const jpegs = await Promise.all(pages.map(async c => ({ jpeg: await toBlob(c, 'image/jpeg', 0.9), width: PAGE_W, height: PAGE_H })))
      download(await jpegPagesToPdf(jpegs), `${base}.pdf`)
    } catch { setError('Export failed') }
    setBusy(false)
  }

  const btn = (active: boolean): CSSProperties => ({
    padding: '6px 10px', cursor: 'pointer', fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '1px', fontSize: '12px',
    background: active ? 'var(--ink)' : 'transparent', color: active ? 'var(--paper)' : 'var(--ink)', border: '2px solid var(--ink)',
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9600, background: 'rgba(10,10,10,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
      <motion.div
        role="dialog" aria-modal="true" aria-labelledby="export-title"
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(560px, 100%)', maxHeight: '96vh', display: 'flex', flexDirection: 'column', gap: '10px',
          background: 'var(--paper)', color: 'var(--ink)', border: '4px solid var(--ink)', boxShadow: '8px 8px 0 var(--ink)',
          padding: '14px 16px', fontFamily: "'AnimeAce', sans-serif", fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 id="export-title" style={{ margin: 0, fontFamily: 'BlambotClassic, sans-serif', letterSpacing: '3px', fontSize: '18px' }}>SAVE THE CHAPTER</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--ink)', cursor: 'pointer' }}><CsmIcon name="close" size={20} /></button>
        </div>

        <div role="radiogroup" aria-label="What to save" style={{ display: 'flex', gap: '8px' }}>
          <button role="radio" aria-checked={scope === 'recent'} onClick={() => setScope('recent')} style={btn(scope === 'recent')}>LAST {RECENT} LINES</button>
          <button role="radio" aria-checked={scope === 'all'} onClick={() => setScope('all')} style={btn(scope === 'all')}>WHOLE CHAPTER ({real.length})</button>
        </div>

        {/* preview */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--ink) 8%, transparent)', padding: '8px' }}>
          {!pages && !error && <span style={{ padding: '120px 0' }}>Inking the panels…</span>}
          {error && <span style={{ padding: '120px 0' }}>✕ {error}</span>}
          {pages && preview[at] && (
            <img src={preview[at]} alt={`Page ${at + 1} of ${pages.length}`}
              style={{ maxWidth: '100%', maxHeight: '58vh', aspectRatio: `${PAGE_W} / ${PAGE_H}`, boxShadow: '3px 3px 0 var(--ink)', border: '2px solid var(--ink)' }} />
          )}
        </div>
        {pages && pages.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <button onClick={() => setAt(a => Math.max(0, a - 1))} disabled={at === 0} aria-label="Previous page" style={btn(false)}>‹</button>
            <span>page {at + 1} / {pages.length}</span>
            <button onClick={() => setAt(a => Math.min(pages.length - 1, a + 1))} disabled={at === pages.length - 1} aria-label="Next page" style={btn(false)}>›</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={savePng} disabled={!pages || busy || !!error} style={btn(false)}>PNG {pages && pages.length > 1 ? `(PAGE ${at + 1})` : ''}</button>
          <button onClick={savePdf} disabled={!pages || busy || !!error} style={btn(true)}>{busy ? 'INKING…' : `PDF${pages ? ` · ${pages.length} PAGE${pages.length > 1 ? 'S' : ''}` : ''}`}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
