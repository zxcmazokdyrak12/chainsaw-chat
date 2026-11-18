import type { Server, Socket } from 'socket.io'
import type { SocketData } from '../types.js'
import type { SocketCtx } from './context.js'
import { registerRoomsHandlers } from './rooms.js'
import { registerMessagesHandlers } from './messages.js'
import { registerCallsHandlers } from './calls.js'
import { registerPresenceHandlers } from './presence.js'

export function registerSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    const data = socket.data as SocketData
    console.log('connected:', socket.id)

    const ensureMember: SocketCtx['ensureMember'] = (roomId, username) => {
      if (!data.username && username) data.username = username
      if (roomId && !socket.rooms.has(roomId)) {
        socket.rooms.forEach(room => { if (room !== socket.id) socket.leave(room) })
        socket.join(roomId)
        data.currentRoom = roomId
      }
      return data.username
    }

    const ctx: SocketCtx = { io, socket, data, ensureMember }
    registerRoomsHandlers(ctx)
    registerMessagesHandlers(ctx)
    registerCallsHandlers(ctx)
    registerPresenceHandlers(ctx)
  })
}
