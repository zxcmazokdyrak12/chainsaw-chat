import type { Server, Socket } from 'socket.io'
import type { SocketData } from '../types.js'

// in-memory state shared by the handlers (resets on restart, which is fine for typing/calls/presence)

// roomId → { socketId → username } — who is typing right now
export const typingUsers: Record<string, Record<string, string>> = {}

// roomId → { socketId → username } — who is in the video call right now
export const calls: Record<string, Record<string, string>> = {}
export const MAX_CALL_PEERS = 4 // mesh P2P: every peer streams to every other one

export const callParticipants = (roomId: string): string[] => Object.values(calls[roomId] ?? {})

// username (upper-cased) → connected socket ids; lets /auth/guest refuse a name someone is using right now
const online = new Map<string, Set<string>>()
const key = (name: string) => name.toUpperCase()
export const isOnline = (name: string): boolean => (online.get(key(name))?.size ?? 0) > 0
export function markOnline(name: string, socketId: string) {
  const k = key(name)
  if (!online.has(k)) online.set(k, new Set())
  online.get(k)!.add(socketId)
  const t = guestPurge.get(k)
  if (t) { clearTimeout(t); guestPurge.delete(k) }
}
export function markOffline(name: string, socketId: string) {
  const set = online.get(key(name))
  set?.delete(socketId)
  if (set && !set.size) online.delete(key(name))
}

// a guest's room memberships are dropped a while after their last tab closes —
// not instantly, so a reconnect (Render nap, phone in the pocket) doesn't kick them out of their rooms
export const guestPurge = new Map<string, ReturnType<typeof setTimeout>>()
export const GUEST_GRACE_MS = 10 * 60_000

export function leaveCall(io: Server, socket: Socket) {
  const data = socket.data as SocketData
  const roomId = data.callRoom
  if (!roomId) return
  delete data.callRoom
  const call = calls[roomId]
  if (!call?.[socket.id]) return
  delete call[socket.id]
  if (!Object.keys(call).length) delete calls[roomId]
  io.to(roomId).emit('call_peer_left', { socketId: socket.id })
  io.to(roomId).emit('call_state', { roomId, participants: callParticipants(roomId) })
}
