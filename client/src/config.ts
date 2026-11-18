// single place for the backend address.
// Locally: put VITE_API_URL=http://localhost:3001 into client/.env.local
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'https://chainsaw-chat.onrender.com'

// public STUN servers for WebRTC (NAT traversal). For strict NATs add a TURN server here.
// Without TURN, people behind mobile internet / strict NAT can't reach each other directly.
// Free TURN: metered.ca/openrelay → put the values into Vercel env vars (VITE_TURN_URL etc.)
const TURN_URL  = import.meta.env.VITE_TURN_URL as string | undefined
const TURN_USER = import.meta.env.VITE_TURN_USERNAME as string | undefined
const TURN_PASS = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ...(TURN_URL ? [{ urls: TURN_URL.split(',').map(u => u.trim()), username: TURN_USER ?? '', credential: TURN_PASS ?? '' }] : []),
]

// manga reaction stickers — ids must match REACTIONS on the server
export const REACTIONS = [
  { id: 'like',    label: 'Like',    src: '/reactions/like.webp' },
  { id: 'fuck',    label: 'F*** off', src: '/reactions/fuck.webp' },
  { id: 'sad',     label: 'Sad',     src: '/reactions/sad.webp' },
  { id: 'neutral', label: 'Neutral', src: '/reactions/neutral.webp' },
  { id: 'sly',     label: 'Sly',     src: '/reactions/sly.webp' },
  { id: 'angry',   label: 'Angry',   src: '/reactions/angry.webp' },
  { id: 'joy',     label: 'Joy',     src: '/reactions/joy.webp' },
] as const

export type ReactionId = typeof REACTIONS[number]['id']

// old messages may still carry emoji keys (🔥, 😂 …) — those render as text
export const reactionInfo = (key: string) => REACTIONS.find(r => r.id === key) ?? null
