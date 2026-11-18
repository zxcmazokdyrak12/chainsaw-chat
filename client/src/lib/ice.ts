import { API_URL, ICE_SERVERS } from '../config'
import { authHeader } from './auth'

// TURN credentials are minted by the server (short-lived), so no TURN password sits in the bundle.
// Falls back to the static list (STUN + optional VITE_TURN_*) when the server can't help.
let cached: { at: number; servers: RTCIceServer[] } | null = null

export async function getIceServers(): Promise<RTCIceServer[]> {
  if (cached && Date.now() - cached.at < 30 * 60_000) return cached.servers
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    const r = await fetch(`${API_URL}/ice`, { headers: authHeader(), signal: ctrl.signal })
    clearTimeout(t)
    if (!r.ok) return ICE_SERVERS
    const { iceServers } = await r.json() as { iceServers?: RTCIceServer[] }
    if (!Array.isArray(iceServers) || !iceServers.length) return ICE_SERVERS
    cached = { at: Date.now(), servers: iceServers }
    return iceServers
  } catch {
    return ICE_SERVERS
  }
}
