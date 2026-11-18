import type { Server, Socket } from 'socket.io'
import type { SocketData } from '../types.js'

// what every group of socket handlers gets
export interface SocketCtx {
  io: Server
  socket: Socket
  data: SocketData & { username: string }
  // makes sure this socket sits in `roomId` and the user is allowed there (member or the public lobby).
  // After a reconnect the socket is brand new and in no room — this restores it instead of dropping the event.
  // Resolves to the verified username, or null when the user has no business in that room.
  ensureMember: (roomId: unknown) => Promise<string | null>
  // is this user a member of the room (the public lobby counts for everyone)?
  canAccess: (roomId: string) => Promise<boolean>
}
