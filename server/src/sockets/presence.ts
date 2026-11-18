import { prisma } from '../lib/prisma.js'
import { typingUsers, leaveCall } from './state.js'
import type { SocketCtx } from './context.js'

// typing indicator and cleanup on disconnect
export function registerPresenceHandlers({ io, socket, data }: SocketCtx) {
  socket.on('typing_start', ({ roomId, username }: { roomId: string; username: string }) => {
    if (!typingUsers[roomId]) typingUsers[roomId] = {}
    typingUsers[roomId][socket.id] = username
    socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
  })

  socket.on('typing_stop', ({ roomId }: { roomId: string }) => {
    if (typingUsers[roomId]) {
      delete typingUsers[roomId][socket.id]
      socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
    }
  })

  socket.on('disconnect', async () => {
    const roomId   = data.currentRoom
    const username = data.username
    leaveCall(io, socket)

    if (roomId && typingUsers[roomId]) {
      delete typingUsers[roomId][socket.id]
      socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
    }

    if (username) {
      try {
        const [oauthUser, localUser] = await Promise.all([
          prisma.chatUser.findFirst({ where: { username } }),
          prisma.localUser.findUnique({ where: { username } }),
        ])
        if (!oauthUser && !localUser) {
          await prisma.roomMember.deleteMany({ where: { username } })
          console.log(`[🧹 PURGE] Guest ${username} removed`)
        } else {
          console.log(`[💾 KEEP] Registered user ${username} disconnected`)
        }
      } catch (err) { console.error('[Disconnect Error]:', err) }
    }

    console.log('disconnected:', socket.id)
  })
}
