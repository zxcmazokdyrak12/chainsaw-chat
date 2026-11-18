import { calls, MAX_CALL_PEERS, callParticipants, leaveCall } from './state.js'
import type { SocketCtx } from './context.js'

// video calls: membership + WebRTC signaling relay
export function registerCallsHandlers({ io, socket, data, ensureMember }: SocketCtx) {
  // ── Video calls (WebRTC signaling) ─────────────────────────────
  socket.on('call_join', ({ roomId, username }: { roomId: string; username?: string }) => {
    const who = ensureMember(roomId, username)
    if (!who || !roomId) { socket.emit('call_error', 'Not in a room — reload the page'); return }
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

  // relay SDP offers/answers and ICE candidates between two peers of the same call
  for (const evt of ['webrtc_offer', 'webrtc_answer', 'webrtc_ice'] as const) {
    socket.on(evt, ({ to, payload }: { to: string; payload: unknown }) => {
      const roomId = data.callRoom
      if (!roomId || !calls[roomId]?.[to]) return
      io.to(to).emit(evt, { from: socket.id, username: data.username, payload })
    })
  }
}
