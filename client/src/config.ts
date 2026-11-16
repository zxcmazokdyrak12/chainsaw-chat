// single place for the backend address
export const API_URL = 'https://chainsaw-chat.onrender.com'

// public STUN servers for WebRTC (NAT traversal). For strict NATs add a TURN server here.
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

// must match REACTIONS on the server
export const REACTIONS = ['🔥', '🩸', '😂', '❤️', '😱', '🪚'] as const
