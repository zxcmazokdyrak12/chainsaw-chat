// input checks shared by REST routes and socket handlers

// account / guest nicknames: same rule everywhere (stored upper-case)
export const NICK_RE = /^[A-ZА-ЯЁ0-9_-]{2,14}$/
export const normalizeNick = (v: unknown): string => (typeof v === 'string' ? v.trim().toUpperCase() : '')

// avatars are rendered as <img src>: only our own character pictures or the OAuth providers' CDNs,
// so nobody can drop a tracking pixel / huge image URL into everybody's chat
const AVATAR_HOSTS = ['avatars.githubusercontent.com', 'lh3.googleusercontent.com']
export function safeAvatar(v: unknown): string | null {
  if (typeof v !== 'string' || v.length > 300) return null
  if (/^\/avatars\/[\w.-]+\.(png|jpe?g|webp|gif)$/i.test(v)) return v
  try {
    const u = new URL(v)
    return u.protocol === 'https:' && AVATAR_HOSTS.includes(u.hostname) ? v : null
  } catch {
    return null
  }
}

export const MAX_TEXT = 2000
export const MAX_AUDIO = 4_000_000 // ~3 MB of audio as base64
const AUDIO_RE = /^data:audio\/[\w.+-]+(;codecs=[\w.,"-]+)?;base64,[A-Za-z0-9+/]+=*$/

export function safeAudio(v: unknown): string | null {
  if (typeof v !== 'string' || v.length > MAX_AUDIO) return null
  return AUDIO_RE.test(v) ? v : null
}

export const isId = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0
export const isRoomId = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9_-]{1,32}$/.test(v)
