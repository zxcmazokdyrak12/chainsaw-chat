import type { Server, Socket } from 'socket.io'
import type { SocketData } from '../types.js'
import type { SocketCtx } from './context.js'
import { prisma } from '../lib/prisma.js'
import { verifyToken } from '../lib/tokens.js'
import { isRoomId } from '../lib/validate.js'
import { PUBLIC_ROOM } from '../config.js'
import { markOnline } from './state.js'
import { registerRoomsHandlers } from './rooms.js'
import { registerMessagesHandlers } from './messages.js'
import { registerCallsHandlers } from './calls.js'
import { registerPresenceHandlers } from './presence.js'

// per-socket budget for all events together (ICE candidates come in bursts, hence generous)
const EVENTS_PER_WINDOW = 150
const WINDOW_MS = 10_000

export function registerSockets(io: Server) {
  // the lobby must exist as a row: messages reference rooms
  prisma.room.upsert({
    where: { id: PUBLIC_ROOM }, update: {},
    create: { id: PUBLIC_ROOM, name: '# GENERAL', code: 'GENERAL' },
  }).catch((err: Error) => console.error('[Lobby Init]:', err.message))

  // who you are comes from a signed token (account or guest), checked once on connect
  io.use((socket, next) => {
    const user = verifyToken(socket.handshake.auth?.token)
    if (!user) return next(new Error('unauthorized'))
    const data = socket.data as SocketData
    data.username = user.username
    data.guest = !!user.guest
    next()
  })

  io.on('connection', (socket: Socket) => {
    const data = socket.data as SocketCtx['data']
    markOnline(data.username, socket.id)

    // flood guard: drop events over budget instead of letting one client hammer the DB
    let used = 0, windowStart = Date.now(), warned = false
    socket.use((_packet, next) => {
      const now = Date.now()
      if (now - windowStart > WINDOW_MS) { used = 0; windowStart = now; warned = false }
      if (++used > EVENTS_PER_WINDOW) {
        if (!warned) { warned = true; socket.emit('rate_limited', 'Slow down') }
        return
      }
      next()
    })

    const canAccess: SocketCtx['canAccess'] = async (roomId) => {
      if (roomId === PUBLIC_ROOM) return true
      const m = await prisma.roomMember.findUnique({
        where: { roomId_username: { roomId, username: data.username } }, select: { roomId: true },
      })
      return !!m
    }

    const ensureMember: SocketCtx['ensureMember'] = async (roomId) => {
      if (!isRoomId(roomId)) return null
      if (socket.rooms.has(roomId)) return data.username
      if (!(await canAccess(roomId))) return null
      socket.rooms.forEach(room => { if (room !== socket.id) socket.leave(room) })
      socket.join(roomId)
      data.currentRoom = roomId
      return data.username
    }

    const ctx: SocketCtx = { io, socket, data, ensureMember, canAccess }
    registerRoomsHandlers(ctx)
    registerMessagesHandlers(ctx)
    registerCallsHandlers(ctx)
    registerPresenceHandlers(ctx)
  })
}
