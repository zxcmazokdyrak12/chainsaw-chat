import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { generateCode, getUserRooms, getRoomHistory } from '../lib/rooms.js'
import { isRoomId } from '../lib/validate.js'
import { callParticipants, leaveCall } from './state.js'
import type { SocketCtx } from './context.js'

// "X joined the room" only when it's news: not while X already has another tab in the room,
// and not again within 10 minutes (Render naps → reconnects → re-joins)
const announced = new Map<string, number>()
const ANNOUNCE_EVERY = 10 * 60_000

// listing, creating and joining rooms. The username always comes from the verified socket, never the payload.
export function registerRoomsHandlers({ io, socket, data, canAccess }: SocketCtx) {
  // wrong codes are capped per socket: room codes must not be brute-forceable
  let codeTries = 0, codeWindow = Date.now()
  let created = 0, createdWindow = Date.now()

  socket.on('get_rooms', async () => {
    try { socket.emit('rooms_list', await getUserRooms(data.username)) } catch (err) { console.error(err) }
  })

  socket.on('create_room', async (p: { roomName?: unknown } = {}) => {
    if (Date.now() - createdWindow > 3600_000) { created = 0; createdWindow = Date.now() }
    if (++created > 10) { socket.emit('join_error', 'Too many rooms, wait a bit'); return }
    try {
      const code = generateCode()
      const id   = crypto.randomUUID().replace(/-/g, '').slice(0, 20)
      const raw  = typeof p.roomName === 'string' ? p.roomName.replace(/[\u0000-\u001f\u007f]/g, '').trim() : ''
      const name = raw ? `# ${raw.toUpperCase().slice(0, 16)}` : `# ROOM-${code}`

      await prisma.room.create({ data: { id, name, code, createdBy: data.username } })
      await prisma.roomMember.create({ data: { roomId: id, username: data.username } })

      socket.emit('rooms_list', await getUserRooms(data.username))
      socket.emit('room_created', { id, code, name })
    } catch (err) {
      console.error(err)
    }
  })

  socket.on('join_by_code', async (p: { code?: unknown } = {}) => {
    if (Date.now() - codeWindow > 60_000) { codeTries = 0; codeWindow = Date.now() }
    if (++codeTries > 8) { socket.emit('join_error', 'Too many tries — wait a minute'); return }
    const code = typeof p.code === 'string' ? p.code.trim().slice(0, 16) : ''
    if (!/^[A-Za-z0-9]{4,16}$/.test(code)) { socket.emit('join_error', 'Room not found'); return }
    try {
      const room = await prisma.room.findFirst({ where: { code: { equals: code, mode: 'insensitive' } } })
      if (!room) { socket.emit('join_error', 'Room not found'); return }

      await prisma.roomMember.upsert({
        where:  { roomId_username: { roomId: room.id, username: data.username } },
        update: {},
        create: { roomId: room.id, username: data.username },
      })
      codeTries = 0
      socket.emit('rooms_list', await getUserRooms(data.username))
      socket.emit('join_by_code_success', { roomId: room.id })
    } catch (err) {
      console.error(err)
      socket.emit('join_error', 'Server error')
    }
  })

  // reading a room needs a membership (or the public lobby) — knowing the id is not enough
  socket.on('join_room', async (p: { roomId?: unknown } = {}) => {
    const roomId = p.roomId
    if (!isRoomId(roomId)) return
    try {
      if (!(await canAccess(roomId))) { socket.emit('join_error', 'You are not in this room'); return }
      if (data.callRoom && data.callRoom !== roomId) leaveCall(io, socket)
      socket.rooms.forEach(room => { if (room !== socket.id) socket.leave(room) })
      socket.join(roomId)
      data.currentRoom = roomId

      socket.emit('room_history', await getRoomHistory(roomId))
      const key = `${roomId}:${data.username}`
      const elsewhere = (await io.in(roomId).fetchSockets()).some(s => s.id !== socket.id && s.data?.username === data.username)
      if (!elsewhere && Date.now() - (announced.get(key) ?? 0) > ANNOUNCE_EVERY) {
        if (announced.size > 5000) announced.clear()
        announced.set(key, Date.now())
        socket.to(roomId).emit('user_joined', { username: data.username, roomId })
      }

      const marks = await prisma.readMark.findMany({ where: { roomId } })
      socket.emit('seen_state', {
        roomId,
        marks: Object.fromEntries(marks.map((m: { username: string; lastReadId: bigint }) => [m.username, Number(m.lastReadId)])),
      })
      socket.emit('call_state', { roomId, participants: callParticipants(roomId) })
    } catch (err) { console.error('[Join Room Error]:', err) }
  })
}
