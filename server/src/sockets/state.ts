import type { Server, Socket } from 'socket.io'
import type { SocketData } from '../types.js'

// in-memory state shared by the handlers (resets on restart, which is fine for typing/calls)

// roomId → { socketId → username } — who is typing right now
export const typingUsers: Record<string, Record<string, string>> = {}

// roomId → { socketId → username } — who is in the video call right now
export const calls: Record<string, Record<string, string>> = {}
export const MAX_CALL_PEERS = 4 // mesh P2P: every peer streams to every other one

export const callParticipants = (roomId: string): string[] => Object.values(calls[roomId] ?? {})

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
