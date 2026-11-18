// "Save the chapter as a manga page": the chat is laid out again on A4 canvases — panels, balloons,
// screentone, narration boxes — instead of screenshotting the UI. Spoilers stay censored.
import { reactionInfo } from '../config'
import { findCommand } from './commands'
import { mediaUrl } from './media'
import { maskSpoilers } from './spoiler'
import type { MessageItem } from '../chatTypes'

export const PAGE_W = 1240 // A4 at 150 dpi
export const PAGE_H = 1754
const M = 64          // page margin
const GUTTER = 22     // space between panels
const INK = '#111'
const PAPER = '#fbf9f3'
const FOOT = 96       // reserved at the bottom for the page number

const F_TEXT = "'AnimeAce', sans-serif"
const F_NAME = "'BlambotClassic', sans-serif"
const F_SFX = "'DeathRattle', 'BlambotClassic', sans-serif"

export interface ExportOptions {
  messages: MessageItem[]
  roomName: string
  chapter: number
  me: string
}

type Kind = 'line' | 'shout' | 'image' | 'voice' | 'contract' | 'command'
interface Panel { msg: MessageItem; kind: Kind; w: number; h: number; lines: string[]; font: number }

// ── images ──────────────────────────────────────────────────────
const cache = new Map<string, Promise<HTMLImageElement | null>>()
function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  if (!cache.has(src)) {
    cache.set(src, new Promise(resolve => {
      const img = new Image()
      img.crossOrigin = 'anonymous' // canvas must stay exportable
      const t = setTimeout(() => resolve(null), 6000)
      img.onload = () => { clearTimeout(t); resolve(img) }
      img.onerror = () => { clearTimeout(t); resolve(null) }
      img.src = src
    }))
  }
  return cache.get(src)!
}

// ── text ────────────────────────────────────────────────────────
const isShout = (t: string) => t.length >= 4 && t === t.toUpperCase() && /[A-ZА-ЯЁ]{3}/.test(t)

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/)) {
      if (!word) continue
      const next = line ? `${line} ${word}` : word
      if (ctx.measureText(next).width <= maxW) { line = next; continue }
      if (line) out.push(line)
      // a single word wider than the balloon gets cut
      let w = word
      while (ctx.measureText(w).width > maxW && w.length > 1) {
        let cut = w.length - 1
        while (cut > 1 && ctx.measureText(w.slice(0, cut)).width > maxW) cut--
        out.push(w.slice(0, cut))
        w = w.slice(cut)
      }
      line = w
    }
    if (line) out.push(line)
  }
  return out.slice(0, 14).map((l, i, a) => (i === 13 && a.length === 14 ? l + '…' : l))
}

// a line of text where █ runs (masked spoilers) become hatched black bars
function drawLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: 'center' | 'left') {
  const parts = text.split(/(█+)/).filter(Boolean)
  const total = parts.reduce((w, p) => w + ctx.measureText(p).width, 0)
  let cx = align === 'center' ? x - total / 2 : x
  const fontPx = parseInt(ctx.font, 10) || 24
  for (const p of parts) {
    const w = ctx.measureText(p).width
    if (p[0] === '█') {
      ctx.save()
      ctx.fillStyle = INK
      ctx.fillRect(cx, y - fontPx * 0.8, w, fontPx * 1.05)
      ctx.strokeStyle = 'rgba(255,255,255,.35)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let k = -fontPx; k < w; k += 6) { ctx.moveTo(cx + k, y + fontPx * 0.25); ctx.lineTo(cx + k + fontPx, y - fontPx * 0.8) }
      ctx.save(); ctx.rect(cx, y - fontPx * 0.8, w, fontPx * 1.05); ctx.clip(); ctx.stroke(); ctx.restore()
      ctx.restore()
    } else {
      ctx.textAlign = 'left'
      ctx.fillText(p, cx, y)
    }
    cx += w
  }
}

// ── backgrounds ─────────────────────────────────────────────────
let tone: CanvasPattern | null = null
function screentone(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (tone) return tone
  const c = document.createElement('canvas')
  c.width = c.height = 10
  const t = c.getContext('2d')!
  t.fillStyle = PAPER; t.fillRect(0, 0, 10, 10)
  t.fillStyle = '#9a9a9a'
  t.beginPath(); t.arc(2.5, 2.5, 1.5, 0, Math.PI * 2); t.arc(7.5, 7.5, 1.5, 0, Math.PI * 2); t.fill()
  tone = ctx.createPattern(c, 'repeat')
  return tone
}

function speedLines(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.hypot(w, h)
  ctx.strokeStyle = INK
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2 + (seed % 7) * 0.01
    const inner = 0.28 + ((i * 37 + seed) % 10) / 40
    ctx.lineWidth = 1 + ((i * 13 + seed) % 3)
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * r * inner * 0.5, cy + Math.sin(a) * r * inner * 0.5)
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    ctx.stroke()
  }
}

// ── balloons ────────────────────────────────────────────────────
function balloon(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, round: boolean, tailX: number, tailY: number) {
  ctx.save()
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = INK
  ctx.lineWidth = 4
  ctx.beginPath()
  if (round) ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  else ctx.roundRect(x, y, w, h, 34)
  ctx.fill()
  ctx.stroke()
  // tail: a curved wedge from the balloon's edge towards the speaker
  const below = tailY > y + h / 2
  const bx = Math.max(x + w * 0.22, Math.min(x + w * 0.78, tailX))
  const edge = (px: number) => {
    if (!round) return below ? y + h - 2 : y + 2
    const k = (px - (x + w / 2)) / (w / 2)
    const dy = (h / 2) * Math.sqrt(Math.max(0, 1 - k * k))
    return y + h / 2 + (below ? dy : -dy) * 0.94
  }
  // short and stubby like an inked tail: at most ~70px, pointing at the speaker
  const baseY = edge(bx)
  const d = Math.hypot(tailX - bx, tailY - baseY) || 1
  const len = Math.min(70, d)
  tailX = bx + ((tailX - bx) / d) * len
  tailY = baseY + ((tailY - baseY) / d) * len
  const a = bx - 20, b = bx + 20
  ctx.beginPath()
  ctx.moveTo(a, edge(a))
  ctx.quadraticCurveTo((a + tailX) / 2, (edge(a) + tailY) / 2 - 6, tailX, tailY)
  ctx.quadraticCurveTo((b + tailX) / 2 + 6, (edge(b) + tailY) / 2, b, edge(b))
  ctx.fill()
  ctx.stroke()
  // paper over the outline where the tail joins the balloon
  ctx.beginPath()
  ctx.moveTo(a + 4, edge(a + 4)); ctx.lineTo(b - 4, edge(b - 4))
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.stroke()
  ctx.restore()
}

function burst(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, seed: number) {
  ctx.save()
  ctx.beginPath()
  const n = 22
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2
    const out = i % 2 === 0 ? 1.18 + ((i * 7 + seed) % 5) / 30 : 0.92
    const px = cx + Math.cos(a) * rx * out, py = cy + Math.sin(a) * ry * out
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = '#fff'; ctx.fill()
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke()
  ctx.restore()
}

function narration(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 22) {
  ctx.save()
  ctx.font = `${size}px ${F_NAME}`
  const w = ctx.measureText(text).width + 22
  ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3
  ctx.fillRect(x, y, w, size + 14); ctx.strokeRect(x, y, w, size + 14)
  ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x + 11, y + size + 4)
  ctx.restore()
  return w
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / k, sh = h / k
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h)
}

// ── layout ──────────────────────────────────────────────────────
const CONTENT_W = PAGE_W - M * 2

function measure(ctx: CanvasRenderingContext2D, msg: MessageItem, width: number): Panel {
  const text = maskSpoilers(msg.content ?? '')
  if (msg.type === 'contract' && msg.poll) return { msg, kind: 'contract', w: width, h: 230 + msg.poll.options.length * 52, lines: [], font: 0 }
  if (msg.type === 'image' && msg.media) return { msg, kind: 'image', w: width, h: width > 700 ? 520 : 420, lines: [], font: 0 }
  if (msg.type === 'audio') return { msg, kind: 'voice', w: width, h: 230, lines: [], font: 0 }
  if (findCommand(msg.content)) return { msg, kind: 'command', w: width, h: 260, lines: [], font: 0 }
  const shout = isShout(text)
  const font = shout ? 40 : 26
  ctx.font = `${font}px ${shout ? F_NAME : F_TEXT}`
  // room left next to the speaker, minus the balloon's own padding
  const room = width - Math.min(width * 0.32, 300) - 40 - (shout ? 130 : 96)
  const lines = wrap(ctx, text, Math.max(160, Math.min(room, 640)))
  const textH = lines.length * font * 1.38
  const h = Math.max(250, textH + (shout ? 190 : 150) + (msg.replyTo ? 50 : 0))
  return { msg, kind: shout ? 'shout' : 'line', w: width, h, lines, font }
}

// short lines share a row; everything else gets the full width
function isSmall(ctx: CanvasRenderingContext2D, msg: MessageItem): boolean {
  if (msg.type && msg.type !== 'text') return false
  if (msg.replyTo || findCommand(msg.content)) return false
  ctx.font = `26px ${F_TEXT}`
  return ctx.measureText(maskSpoilers(msg.content ?? '')).width < 520
}

function rows(ctx: CanvasRenderingContext2D, messages: MessageItem[]): Panel[][] {
  const out: Panel[][] = []
  for (let i = 0; i < messages.length; i++) {
    const a = messages[i]!, b = messages[i + 1]
    if (b && isSmall(ctx, a) && isSmall(ctx, b)) {
      const split = 0.5 + ((i * 17) % 11 - 5) / 100   // 45–55 %, so the grid doesn't look machine-made
      const wa = Math.round((CONTENT_W - GUTTER) * split), wb = CONTENT_W - GUTTER - wa
      const pa = measure(ctx, a, wa), pb = measure(ctx, b, wb)
      const h = Math.max(pa.h, pb.h)
      out.push([{ ...pa, h }, { ...pb, h }])
      i++
    } else {
      out.push([measure(ctx, a, CONTENT_W)])
    }
  }
  return out
}

// ── drawing one panel ───────────────────────────────────────────
async function drawPanel(ctx: CanvasRenderingContext2D, p: Panel, x: number, y: number, me: string, n: number) {
  const { msg, w, h } = p
  const own = msg.username === me
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()

  // background
  ctx.fillStyle = PAPER; ctx.fillRect(x, y, w, h)
  if (p.kind === 'shout' || p.kind === 'command') speedLines(ctx, x, y, w, h, n)
  else if (n % 3 === 1) { const t = screentone(ctx); if (t) { ctx.fillStyle = t; ctx.fillRect(x, y, w, h) } }

  if (p.kind === 'image') {
    const img = await loadImage(mediaUrl(msg.media!))
    if (img) { ctx.filter = 'grayscale(1) contrast(1.15)'; cover(ctx, img, x, y, w, h); ctx.filter = 'none' }
    if (msg.content) {
      ctx.font = `24px ${F_TEXT}`
      const lines = wrap(ctx, maskSpoilers(msg.content), w * 0.6)
      const bh = lines.length * 32 + 34, bw = Math.min(w - 60, Math.max(...lines.map(l => ctx.measureText(l).width)) + 60)
      balloon(ctx, x + w - bw - 24, y + h - bh - 24, bw, bh, false, x + w - 60, y + h - 4)
      ctx.fillStyle = INK
      lines.forEach((l, i) => drawLine(ctx, l, x + w - bw / 2 - 24, y + h - bh - 24 + 40 + i * 32, 'center'))
    }
  } else {
    // the speaker: their avatar as the "character" in a lower corner
    const av = await loadImage(msg.avatar)
    const size = Math.min(h * 0.72, w * 0.32, 300)
    const ax = own ? x + w - size - 12 : x + 12
    const ay = y + h - size
    if (av && p.kind !== 'command') {
      ctx.save()
      ctx.filter = 'grayscale(1) contrast(1.25)'
      ctx.beginPath(); ctx.roundRect(ax, ay, size, size + 20, [size / 2, size / 2, 0, 0]); ctx.clip()
      cover(ctx, av, ax, ay, size, size)
      ctx.restore()
      ctx.filter = 'none'
    }
    const tailX = own ? ax + size * 0.4 : ax + size * 0.6
    const tailY = ay + size * 0.25

    if (p.kind === 'command') {
      const cmd = findCommand(msg.content)!
      ctx.save()
      ctx.translate(x + w / 2, y + h / 2); ctx.rotate(-0.06)
      ctx.font = `${cmd.sfx.length > 12 ? 64 : 104}px ${F_SFX}`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.strokeText(cmd.sfx, 0, 0)
      ctx.fillStyle = '#fff'; ctx.fillText(cmd.sfx, 0, 0)
      ctx.restore()
    } else if (p.kind === 'contract' && msg.poll) {
      const poll = msg.poll
      const bx = x + (own ? 30 : size + 30), bw = w - size - 70
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 5
      ctx.fillRect(bx, y + 50, bw, h - 90); ctx.strokeRect(bx, y + 50, bw, h - 90)
      ctx.lineWidth = 2; ctx.strokeRect(bx + 8, y + 58, bw - 16, h - 106)
      ctx.fillStyle = INK; ctx.font = `30px ${F_NAME}`; ctx.textAlign = 'left'
      ctx.fillText(poll.kind === 'contract' ? 'CONTRACT 契約' : 'VOTE 投票', bx + 24, y + 98)
      ctx.font = `22px ${F_TEXT}`
      drawLine(ctx, wrap(ctx, maskSpoilers(poll.title), bw - 48)[0] ?? '', bx + 24, y + 136, 'left')
      poll.options.forEach((o, i) => {
        const voters = poll.votes[o.id] ?? []
        const oy = y + 160 + i * 52
        ctx.beginPath(); ctx.arc(bx + 40, oy + 14, 16, 0, Math.PI * 2)
        ctx.fillStyle = voters.length ? '#b3140c' : '#fff'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke()
        ctx.fillStyle = INK; ctx.font = `22px ${F_NAME}`
        const label = `${poll.kind === 'contract' ? 'SIGNED' : o.label} — ${voters.length}`
        ctx.fillText(label, bx + 70, oy + 22)
        const lx = bx + 70 + ctx.measureText(label).width + 24
        ctx.font = `16px ${F_TEXT}`
        let names = voters.join(' · ')
        while (names && ctx.measureText(names).width > bx + bw - 24 - lx) names = names.slice(0, -2)
        ctx.fillText(names !== voters.join(' · ') && names ? names + '…' : names, lx, oy + 21)
      })
    } else {
      const lines = p.kind === 'voice' ? ['♪ ~ a voice note ~ ♪'] : p.lines
      const font = p.kind === 'voice' ? 26 : p.font
      ctx.font = `${font}px ${p.kind === 'shout' ? F_NAME : F_TEXT}`
      const lh = font * 1.38
      const tw = Math.max(...lines.map(l => ctx.measureText(l).width), 120)
      const round = p.kind !== 'shout' && lines.length <= 2
      // an ellipse needs more air around the words than a box does
      const bw = Math.min(w - size - 40, p.kind === 'shout' ? tw + 120 : round ? tw * 1.18 + 80 : tw + 90)
      const bh = lines.length * lh + (p.kind === 'shout' ? 90 : round ? 70 : 56)
      const free = w - size - 30
      const bx = own ? x + Math.max(20, free - bw - 10) : x + size + 20 + Math.max(0, (free - bw) / 3)
      const by = y + (msg.replyTo ? 92 : 58)
      if (msg.replyTo) {
        ctx.font = `17px ${F_TEXT}`
        const q = `↩ ${msg.replyTo.username}: ${maskSpoilers(msg.replyTo.content)}`.slice(0, 60)
        ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2
        const qw = Math.min(bw, ctx.measureText(q).width + 24)
        ctx.fillRect(bx, by - 46, qw, 32); ctx.strokeRect(bx, by - 46, qw, 32)
        ctx.fillStyle = INK; drawLine(ctx, q, bx + 12, by - 24, 'left')
        ctx.font = `${font}px ${p.kind === 'shout' ? F_NAME : F_TEXT}`
      }
      if (p.kind === 'shout') burst(ctx, bx + bw / 2, by + bh / 2, bw / 2, bh / 2, n)
      else balloon(ctx, bx, by, bw, bh, round, tailX, tailY)
      ctx.fillStyle = INK; ctx.textBaseline = 'alphabetic'
      lines.forEach((l, i) => drawLine(ctx, l, bx + bw / 2, by + (bh - lines.length * lh) / 2 + font + i * lh, 'center'))
    }

    // reactions: the stickers people stuck on this line
    const rx0 = own ? x + 20 : x + w - 20
    let rx = rx0
    for (const [key, users] of Object.entries(msg.reactions ?? {})) {
      if (!users.length) continue
      const r = reactionInfo(key)
      const img = r ? await loadImage(r.src) : null
      const s = 54
      const px = own ? rx : rx - s
      if (img) {
        ctx.save(); ctx.beginPath(); ctx.arc(px + s / 2, y + h - s / 2 - 14, s / 2, 0, Math.PI * 2); ctx.clip()
        ctx.filter = 'grayscale(1)'; cover(ctx, img, px, y + h - s - 14, s, s); ctx.restore(); ctx.filter = 'none'
        ctx.beginPath(); ctx.arc(px + s / 2, y + h - s / 2 - 14, s / 2, 0, Math.PI * 2); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke()
      }
      if (users.length > 1) { ctx.font = `20px ${F_NAME}`; ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText(`×${users.length}`, px + s - 6, y + h - 14) }
      rx += own ? s + 26 : -(s + 26)
    }
  }

  // who speaks: a narration box in the top corner
  if (p.kind !== 'command') narration(ctx, `${msg.username ?? '???'}${msg.time ? ` · ${msg.time}` : ''}`, own ? x + w - 16 - nameW(ctx, msg) : x + 16, y + 14)
  ctx.restore()

  // panel border, hand-inked: a heavy line
  ctx.strokeStyle = INK; ctx.lineWidth = 6
  ctx.strokeRect(x, y, w, h)
}

function nameW(ctx: CanvasRenderingContext2D, msg: MessageItem) {
  ctx.save(); ctx.font = `22px ${F_NAME}`
  const w = ctx.measureText(`${msg.username ?? '???'}${msg.time ? ` · ${msg.time}` : ''}`).width + 22
  ctx.restore()
  return w
}

// ── pages ───────────────────────────────────────────────────────
function newPage(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = PAGE_W; c.height = PAGE_H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, PAGE_W, PAGE_H)
  return [c, ctx]
}

function titleBlock(ctx: CanvasRenderingContext2D, o: ExportOptions): number {
  ctx.fillStyle = INK
  ctx.font = `110px ${F_SFX}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(`CHAPTER ${o.chapter}`, M, M + 100)
  ctx.font = `44px ${F_NAME}`
  ctx.fillText(o.roomName.replace(/^#\s*/, ''), M + 6, M + 158)
  ctx.font = `20px ${F_TEXT}`; ctx.textAlign = 'right'
  ctx.fillText(`CHAINSAW CHAT · ${new Date().toLocaleDateString()}`, PAGE_W - M, M + 158)
  ctx.fillRect(M, M + 182, CONTENT_W, 6)
  ctx.fillRect(M, M + 194, CONTENT_W, 2)
  return M + 230
}

function footer(ctx: CanvasRenderingContext2D, page: number) {
  ctx.fillStyle = INK; ctx.font = `24px ${F_TEXT}`; ctx.textAlign = 'center'
  ctx.fillText(`— ${page} —`, PAGE_W / 2, PAGE_H - 40)
}

export async function renderMangaPages(o: ExportOptions): Promise<HTMLCanvasElement[]> {
  await Promise.all([
    document.fonts.load(`26px ${F_TEXT}`), document.fonts.load(`40px ${F_NAME}`), document.fonts.load(`100px ${F_SFX}`),
  ]).catch(() => {})
  const msgs = o.messages.filter(m => !m.system && (m.content || m.media || m.type === 'audio' || m.poll))
  const [first, fctx] = newPage()
  const pages: [HTMLCanvasElement, CanvasRenderingContext2D][] = [[first, fctx]]
  let y = titleBlock(fctx, o)
  let n = 0
  for (const row of rows(fctx, msgs)) {
    const h = Math.min(row[0]!.h, PAGE_H - FOOT - M - 40)
    if (y + h > PAGE_H - FOOT) {
      pages.push(newPage())
      y = M
    }
    const ctx = pages[pages.length - 1]![1]
    let x = M
    for (const p of row) { await drawPanel(ctx, { ...p, h }, x, y, o.me, n++); x += p.w + GUTTER }
    y += h + GUTTER
  }
  if (!msgs.length) {
    fctx.font = `40px ${F_NAME}`; fctx.textAlign = 'center'; fctx.fillStyle = INK
    fctx.fillText('…nothing happened in this chapter yet.', PAGE_W / 2, PAGE_H / 2)
  }
  pages.forEach(([, ctx], i) => footer(ctx, i + 1))
  return pages.map(([c]) => c)
}
