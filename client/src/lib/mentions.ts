// @mentions: "@POWER" in a line. Names are matched case-insensitively.
export const MENTION_RE = /(^|[^\w@])@([\p{L}\p{N}_-]{2,32})/gu

let me = ''
export const setMe = (name: string) => { me = name }
export const getMe = () => me

export function mentionsOf(text: string | null | undefined): string[] {
  const out: string[] = []
  for (const m of (text ?? '').matchAll(MENTION_RE)) out.push(m[2]!.toUpperCase())
  return out
}
export const mentions = (text: string | null | undefined, name: string | null | undefined): boolean =>
  !!name && mentionsOf(text).includes(name.toUpperCase())

// split plain text into text / mention parts (for highlighting)
export function splitMentions(text: string): { text: string; mention?: string }[] {
  const out: { text: string; mention?: string }[] = []
  let last = 0
  for (const m of text.matchAll(MENTION_RE)) {
    const start = m.index! + m[1]!.length
    if (start > last) out.push({ text: text.slice(last, start) })
    out.push({ text: `@${m[2]}`, mention: m[2]!.toUpperCase() })
    last = start + 1 + m[2]!.length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}

// "…hey @po|" → { query: 'po', start } for the autocomplete
export function mentionQuery(text: string, caret: number): { query: string; start: number } | null {
  const m = /(^|\s)@([\p{L}\p{N}_-]{0,32})$/u.exec(text.slice(0, caret))
  if (!m) return null
  return { query: m[2]!, start: caret - m[2]!.length - 1 }
}
