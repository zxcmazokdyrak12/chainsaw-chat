import type { Server, Socket } from 'socket.io'
import type { SocketData } from '../types.js'

// what every group of socket handlers gets
export interface SocketCtx {
  io: Server
  socket: Socket
  data: SocketData
  // after a reconnect the socket is brand new: no username, not in any room.
  // events that carry roomId/username restore that instead of being silently dropped
  ensureMember: (roomId?: string, username?: string) => string | undefined
}
