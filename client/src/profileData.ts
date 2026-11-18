import { getAccountToken } from './lib/auth'
import { API_URL } from './config'

// Shapes returned by GET /profile/:username, plus rank and achievement rules.

export interface ProfileStats {
  lines: number
  shouts: number
  reactions: number
  chapters: number
  daysOnDuty: number
  since: string | null
}

export interface CharacterFields {
  contract: string
  likes: string
  dislikes: string
  dream: string
  favChapter: string
}

export interface ProfileData {
  username: string
  avatar: string | null
  stats: ProfileStats
  page: CharacterFields
}

export const EMPTY_PAGE: CharacterFields = { contract: '', likes: '', dislikes: '', dream: '', favChapter: '' }

export async function fetchProfile(username: string): Promise<ProfileData | null> {
  try {
    const r = await fetch(`${API_URL}/profile/${encodeURIComponent(username)}`)
    if (!r.ok) return null
    return (await r.json()) as ProfileData
  } catch {
    return null
  }
}

export async function saveCharacterPage(fields: CharacterFields): Promise<{ ok: boolean; error?: string }> {
  const token = getAccountToken()
  if (!token) return { ok: false, error: 'Log in with an account to fill in your page' }
  try {
    const r = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(fields),
    })
    const data = await r.json().catch(() => ({}))
    return r.ok ? { ok: true } : { ok: false, error: data.error || 'Could not save' }
  } catch {
    return { ok: false, error: 'Server is sleeping, try again' }
  }
}

// ── ranks: earned by lines spoken ────────────────────────────────

export const RANKS = [
  { title: 'TRAINEE',           from: 0 },
  { title: 'DEVIL HUNTER',      from: 50 },
  { title: 'SENIOR HUNTER',     from: 300 },
  { title: 'DIVISION CAPTAIN',  from: 1000 },
  { title: 'SPECIAL DIVISION',  from: 2500 },
] as const

export function rankOf(lines: number) {
  let i = 0
  while (i + 1 < RANKS.length && lines >= (RANKS[i + 1]?.from ?? Infinity)) i++
  const cur = RANKS[i]!
  const next = RANKS[i + 1]
  const progress = next ? (lines - cur.from) / (next.from - cur.from) : 1
  return { index: i, title: cur.title, next: next?.title ?? null, nextAt: next?.from ?? null, progress: Math.max(0, Math.min(1, progress)) }
}

// ── achievement stamps ───────────────────────────────────────────

export interface Achievement { id: string; label: string; earned: boolean }

export function achievementsOf(s: ProfileStats): Achievement[] {
  return [
    { id: 'first-line',  label: 'FIRST\nLINE',     earned: s.lines >= 1 },
    { id: 'lines-100',   label: '100\nLINES',      earned: s.lines >= 100 },
    { id: 'lines-1000',  label: '1000\nLINES',     earned: s.lines >= 1000 },
    { id: 'first-shout', label: 'FIRST\nSHOUT',    earned: s.shouts >= 1 },
    { id: 'chapters-3',  label: '3\nCHAPTERS',     earned: s.chapters >= 3 },
    { id: 'reacts-100',  label: '100\nREACTS',     earned: s.reactions >= 100 },
    { id: 'week',        label: 'WEEK ON\nDUTY',   earned: s.daysOnDuty >= 7 },
    { id: 'month',       label: 'MONTH ON\nDUTY',  earned: s.daysOnDuty >= 30 },
  ]
}
