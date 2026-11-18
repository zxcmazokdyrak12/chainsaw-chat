import { prisma } from '../lib/prisma.js'
import { generateCode, getUserRooms, getRoomHistory } from '../lib/rooms.js'
import { callParticipants, leaveCall } from './state.js'
import type { SocketCtx } from './context.js'

// listing, creating and joining rooms
export function registerRoomsHandlers({ io, socket, data }: SocketCtx) {
  socket.on('get_rooms', async ({ username }: { username: string }) => {
    const list = await getUserRooms(username)
    socket.emit('rooms_list', list)
  })

  socket.on('create_room', async ({ username, roomName }: { username: string; roomName?: string }) => {
    try {
      const code = generateCode()
      const id   = code.toLowerCase()
      const name = roomName ? `# ${roomName.toUpperCase().slice(0, 16)}` : `# ROOM-${code}`

      await prisma.room.create({ data: { id, name, code, createdBy: username } })
      await prisma.roomMember.create({ data: { roomId: id, username } })

      const list = await getUserRooms(username)
      socket.emit('rooms_list', list)
      socket.emit('room_created', { id, code, name })
    } catch (err) {
      console.error(err)
    }
  })

  socket.on('join_by_code', async ({ code, username }: { code: string; username: string }) => {
    try {
      const room = await prisma.room.findFirst({
        where: { code: { equals: code, mode: 'insensitive' } },
      })
      if (!room) { socket.emit('join_error', 'Room not found'); return }

      await prisma.roomMember.upsert({
        where:  { roomId_username: { roomId: room.id, username } },
        update: {},
        create: { roomId: room.id, username },
      })

      const list = await getUserRooms(username)
      socket.emit('rooms_list', list)
      socket.emit('join_by_code_success', { roomId: room.id })
    } catch (err) {
      console.error(err)
      socket.emit('join_error', 'Server error')
    }
  })

  socket.on('join_room', async ({ roomId, username }: { roomId: string; username: string }) => {
    if (data.callRoom && data.callRoom !== roomId) leaveCall(io, socket)
    socket.rooms.forEach(room => { if (room !== socket.id) socket.leave(room) })
    socket.join(roomId)
    data.currentRoom = roomId
    data.username    = username

    const history = await getRoomHistory(roomId)
    socket.emit('room_history', history)
    socket.to(roomId).emit('user_joined', { username, roomId })

    try {
      const marks = await prisma.readMark.findMany({ where: { roomId } })
      socket.emit('seen_state', {
        roomId,
        marks: Object.fromEntries(marks.map((m: { username: string; lastReadId: bigint }) => [m.username, Number(m.lastReadId)])),
      })
    } catch (err) { console.error('[Seen State Error]:', err) }

    socket.emit('call_state', { roomId, participants: callParticipants(roomId) })
  })
}
