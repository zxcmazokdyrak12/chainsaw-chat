import { prisma } from '../lib/prisma.js'
import { typingUsers, leaveCall, markOffline, isOnline, guestPurge, GUEST_GRACE_MS } from './state.js'
import type { SocketCtx } from './context.js'

// typing indicator and cleanup on disconnect
export function registerPresenceHandlers({ io, socket, data }: SocketCtx) {
  const stopTyping = (roomId: string | undefined) => {
    if (!roomId || !typingUsers[roomId]?.[socket.id]) return
    delete typingUsers[roomId][socket.id]
    if (!Object.keys(typingUsers[roomId]).length) delete typingUsers[roomId]
    socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId] ?? {}))
  }

  // only for the room this socket is actually in
  socket.on('typing_start', () => {
    const roomId = data.currentRoom
    if (!roomId || !socket.rooms.has(roomId)) return
    if (!typingUsers[roomId]) typingUsers[roomId] = {}
    typingUsers[roomId][socket.id] = data.username
    socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
  })

  socket.on('typing_stop', () => stopTyping(data.currentRoom))

  socket.on('disconnect', () => {
    leaveCall(io, socket)
    stopTyping(data.currentRoom)
    markOffline(data.username, socket.id)

    // guests leave no trace — but give them a grace period to come back (reconnects, a second tab)
    if (!data.guest) return
    const name = data.username
    const key = name.toUpperCase()
    if (isOnline(name) || guestPurge.has(key)) return
    guestPurge.set(key, setTimeout(async () => {
      guestPurge.delete(key)
      if (isOnline(name)) return
      try {
        await prisma.roomMember.deleteMany({ where: { username: name } })
        console.log(`[🧹 PURGE] Guest ${name} removed`)
      } catch (err) { console.error('[Guest Purge Error]:', err) }
    }, GUEST_GRACE_MS))
  })
}
