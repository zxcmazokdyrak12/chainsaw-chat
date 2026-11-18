import { calls, MAX_CALL_PEERS, callParticipants, leaveCall } from './state.js'
import type { SocketCtx } from './context.js'

const MAX_SIGNAL = 20_000 // an SDP is a few KB; anything bigger is not a real offer

// video calls: membership + WebRTC signaling relay
export function registerCallsHandlers({ io, socket, data, ensureMember }: SocketCtx) {
  socket.on('call_join', async (p: { roomId?: unknown } = {}) => {
    const who = await ensureMember(p.roomId)
    if (!who) { socket.emit('call_error', 'Not in this room — reload the page'); return }
    const roomId = p.roomId as string
    if (data.callRoom && data.callRoom !== roomId) leaveCall(io, socket)
    const call = calls[roomId] ?? (calls[roomId] = {})
    if (Object.keys(call).length >= MAX_CALL_PEERS && !call[socket.id]) {
      socket.emit('call_error', 'Call is full')
      return
    }
    const peers = Object.entries(call).map(([socketId, username]) => ({ socketId, username }))
    call[socket.id] = who
    data.callRoom = roomId
    socket.emit('call_peers', { roomId, peers })
    io.to(roomId).emit('call_state', { roomId, participants: callParticipants(roomId) })
  })

  socket.on('call_leave', () => leaveCall(io, socket))

  // relay SDP offers/answers and ICE candidates — only between two peers of the same call
  for (const evt of ['webrtc_offer', 'webrtc_answer', 'webrtc_ice'] as const) {
    socket.on(evt, (p: { to?: unknown; payload?: unknown } = {}) => {
      const roomId = data.callRoom
      if (!roomId || typeof p.to !== 'string' || p.to === socket.id) return
      const call = calls[roomId]
      if (!call?.[socket.id] || !call[p.to]) return
      if (JSON.stringify(p.payload ?? null).length > MAX_SIGNAL) return
      io.to(p.to).emit(evt, { from: socket.id, username: data.username, payload: p.payload })
    })
  }
}
