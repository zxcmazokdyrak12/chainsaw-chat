// single place for the backend address
export const API_URL = 'https://chainsaw-chat.onrender.com'

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

// must match REACTIONS on the server
export const REACTIONS = ['🔥', '🩸', '😂', '❤️', '😱', '🪚'] as const
