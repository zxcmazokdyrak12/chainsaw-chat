// ||spoiler|| syntax (like Discord): the part between double bars is hidden behind manga hatching

export interface Segment { text: string; spoiler: boolean }

const RE = /\|\|([\s\S]+?)\|\|/g

export function splitSpoilers(text: string): Segment[] {
  const out: Segment[] = []
  let last = 0
  for (const m of text.matchAll(RE)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index), spoiler: false })
    out.push({ text: m[1]!, spoiler: true })
    last = m.index! + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), spoiler: false })
  return out
}

export const hasSpoiler = (text: string | null | undefined): boolean => !!text && /\|\|[\s\S]+?\|\|/.test(text)

// for places that can't be clicked open: notifications, quotes, search results, the exported page
export const maskSpoilers = (text: string | null | undefined): string =>
  (text ?? '').replace(RE, (_, s: string) => '█'.repeat(Math.min(12, Math.max(3, s.length))))

// wrap the selection of a textarea in ||…|| (Ctrl+Shift+S)
export function wrapSelection(value: string, start: number, end: number): { value: string; caret: number } {
  if (start === end) return { value: value.slice(0, start) + '||||' + value.slice(end), caret: start + 2 }
  const inner = value.slice(start, end)
  return { value: value.slice(0, start) + `||${inner}||` + value.slice(end), caret: end + 4 }
}
