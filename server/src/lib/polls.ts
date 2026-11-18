// Contracts and polls: a message others can put their seal on.
//   /contract Raid the Gun Devil tonight         → one "SIGN" option, people sign it
//   /poll Where do we eat? | Ramen | Pizza       → 2–6 options, one seal per person

export interface PollOption { id: string; label: string }
export interface Poll {
  kind: 'contract' | 'poll'
  title: string
  options: PollOption[]
  votes: Record<string, string[]>
  closed: boolean
}

const clean = (s: string, max: number) => s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)

// returns null when the text is not a (valid) contract / poll command
export function parsePollCommand(text: string): Poll | null {
  const m = /^\/(contract|poll)\s+([\s\S]+)$/i.exec(text.trim())
  if (!m) return null
  const kind = m[1]!.toLowerCase() as Poll['kind']
  if (kind === 'contract') {
    const title = clean(m[2]!, 160)
    if (!title) return null
    return { kind, title, options: [{ id: 'sign', label: 'SIGN' }], votes: {}, closed: false }
  }
  const [rawTitle, ...rawOptions] = m[2]!.split('|')
  const title = clean(rawTitle ?? '', 160)
  const labels = [...new Set(rawOptions.map(o => clean(o, 40)).filter(Boolean))].slice(0, 6)
  if (!title || labels.length < 2) return null
  return { kind, title, options: labels.map((label, i) => ({ id: `o${i + 1}`, label })), votes: {}, closed: false }
}

// one seal per person in a poll (moving it is fine), toggle for a contract
export function castVote(poll: Poll, optionId: string, who: string): Poll | null {
  if (poll.closed || !poll.options.some(o => o.id === optionId)) return null
  const votes: Record<string, string[]> = {}
  const had = (poll.votes[optionId] ?? []).includes(who)
  for (const o of poll.options) {
    const list = (poll.votes[o.id] ?? []).filter(u => u !== who)
    if (o.id === optionId && !had) list.push(who)
    if (list.length) votes[o.id] = list
  }
  return { ...poll, votes }
}

export function isPoll(v: unknown): v is Poll {
  const p = v as Poll
  return !!p && typeof p === 'object' && (p.kind === 'contract' || p.kind === 'poll') && Array.isArray(p.options) && typeof p.votes === 'object'
}
