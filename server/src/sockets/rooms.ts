import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { generateCode, getUserRooms, getRoomHistory, PAGE } from '../lib/rooms.js'
import { deleteMedia } from '../lib/storage.js'
import { PUBLIC_ROOM } from '../config.js'
import { isId, isRoomId } from '../lib/validate.js'
import { callParticipants, leaveCall } from './state.js'
import type { SocketCtx } from './context.js'

// "X joined the room" only when it's news: not while X already has another tab in the room,
// and not again within 10 minutes (Render naps → reconnects → re-joins)
const announced = new Map<string, number>()
const ANNOUNCE_EVERY = 10 * 60_000

// listing, creating and joining rooms. The username always comes from the verified socket, never the payload.
export function registerRoomsHandlers({ io, socket, data, canAccess, ensureMember }: SocketCtx) {
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

      const history = await getRoomHistory(roomId)
      socket.emit('room_history', history)
      socket.emit('history_state', { roomId, hasMore: history.length === PAGE })
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

  // ── older pages of the history (scrolling up, or jumping to an old line) ──
  socket.on('load_older', async (p: { roomId?: unknown; before?: unknown } = {}) => {
    if (!isId(p.before)) return
    try {
      const who = await ensureMember(p.roomId)
      if (!who) return
      const messages = await getRoomHistory(p.roomId as string, BigInt(p.before))
      socket.emit('older_messages', { roomId: p.roomId, messages, hasMore: messages.length === PAGE })
    } catch (err) { console.error('[Older Error]:', err) }
  })

  // ── room management ──────────────────────────────────────────
  const roomOf = async (roomId: unknown) =>
    isRoomId(roomId) && roomId !== PUBLIC_ROOM ? prisma.room.findUnique({ where: { id: roomId } }) : null

  // who is in it (and who is online right now)
  socket.on('room_members', async (p: { roomId?: unknown } = {}) => {
    const roomId = p.roomId
    if (!isRoomId(roomId) || !(await canAccess(roomId))) return
    try {
      const online = new Set((await io.in(roomId).fetchSockets()).map(s => s.data?.username as string))
      const room = roomId === PUBLIC_ROOM ? null : await prisma.room.findUnique({ where: { id: roomId } })
      const names = roomId === PUBLIC_ROOM
        ? [...online]
        : (await prisma.roomMember.findMany({ where: { roomId }, select: { username: true } })).map((m: { username: string }) => m.username)
      socket.emit('room_members', {
        roomId,
        createdBy: room?.createdBy ?? null,
        code: room?.code ?? null,
        members: names.filter(Boolean).sort().map(username => ({ username, online: online.has(username) })),
      })
    } catch (err) { console.error('[Members Error]:', err) }
  })

  const refreshLists = async (roomId: string) => {
    for (const s of await io.in(roomId).fetchSockets()) {
      const name = s.data?.username as string | undefined
      if (name) s.emit('rooms_list', await getUserRooms(name))
    }
  }

  socket.on('leave_room', async (p: { roomId?: unknown } = {}) => {
    try {
      const room = await roomOf(p.roomId)
      if (!room) return
      await prisma.roomMember.deleteMany({ where: { roomId: room.id, username: data.username } })
      for (const s of await io.in(room.id).fetchSockets()) if (s.data?.username === data.username) s.leave(room.id)
      socket.to(room.id).emit('user_left', { roomId: room.id, username: data.username })
      socket.emit('rooms_list', await getUserRooms(data.username))
      socket.emit('room_gone', { roomId: room.id, reason: 'left' })
    } catch (err) { console.error('[Leave Error]:', err) }
  })

  // the rest is for the room's creator only
  socket.on('rename_room', async (p: { roomId?: unknown; name?: unknown } = {}) => {
    try {
      const room = await roomOf(p.roomId)
      if (!room || room.createdBy !== data.username) return
      const raw = typeof p.name === 'string' ? p.name.replace(/[\u0000-\u001f\u007f]/g, '').trim() : ''
      if (!raw) return
      const name = `# ${raw.toUpperCase().slice(0, 16)}`
      await prisma.room.update({ where: { id: room.id }, data: { name } })
      io.to(room.id).emit('room_updated', { id: room.id, name })
      await refreshLists(room.id)
    } catch (err) { console.error('[Rename Error]:', err) }
  })

  socket.on('kick_member', async (p: { roomId?: unknown; username?: unknown } = {}) => {
    try {
      const room = await roomOf(p.roomId)
      if (!room || room.createdBy !== data.username || typeof p.username !== 'string' || p.username === data.username) return
      const target = p.username
      await prisma.roomMember.deleteMany({ where: { roomId: room.id, username: target } })
      for (const s of await io.in(room.id).fetchSockets()) {
        if (s.data?.username !== target) continue
        s.leave(room.id)
        s.emit('room_gone', { roomId: room.id, reason: 'kicked', name: room.name })
        s.emit('rooms_list', await getUserRooms(target))
      }
      io.to(room.id).emit('user_left', { roomId: room.id, username: target, kicked: true })
    } catch (err) { console.error('[Kick Error]:', err) }
  })

  socket.on('delete_room', async (p: { roomId?: unknown } = {}) => {
    try {
      const room = await roomOf(p.roomId)
      if (!room || room.createdBy !== data.username) return
      const members = (await prisma.roomMember.findMany({ where: { roomId: room.id }, select: { username: true } })).map((m: { username: string }) => m.username)
      // uploads may live in R2: remove them first, the rows go with the room (cascade)
      const atts = await prisma.attachment.findMany({ where: { roomId: room.id }, select: { id: true } })
      for (const a of atts) await deleteMedia(a.id)
      const sockets = await io.in(room.id).fetchSockets()
      await prisma.room.delete({ where: { id: room.id } })
      for (const s of sockets) {
        s.leave(room.id)
        s.emit('room_gone', { roomId: room.id, reason: 'deleted', name: room.name })
      }
      // everyone who had it in their list, online or not in the room right now
      for (const s of await io.fetchSockets()) {
        const name = s.data?.username as string | undefined
        if (name && members.includes(name)) s.emit('rooms_list', await getUserRooms(name))
      }
    } catch (err) { console.error('[Delete Room Error]:', err) }
  })
}
