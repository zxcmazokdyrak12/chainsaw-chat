import { prisma } from '../lib/prisma.js'
import { serializeMessage } from '../lib/rooms.js'
import { MAX_TEXT, isId, safeAudio, safeAvatar } from '../lib/validate.js'
import { REACTIONS, type Reactions } from '../types.js'
import type { SocketCtx } from './context.js'

// message ids are ms timestamps; two messages in the same ms must not collide on the primary key
let lastId = 0
const nextId = () => (lastId = Math.max(Date.now(), lastId + 1))

const cleanText = (v: unknown): string | null =>
  typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, MAX_TEXT) : null

// sending, editing, pinning, reacting, read marks — all scoped to rooms the user belongs to
export function registerMessagesHandlers({ io, socket, data, ensureMember }: SocketCtx) {
  let msgCount = 0, msgReset = Date.now()

  socket.on('send_message', async (p: { roomId?: unknown; content?: unknown; type?: unknown; audioData?: unknown; avatar?: unknown } = {}) => {
    try {
      const now = Date.now()
      if (now - msgReset > 60_000) { msgCount = 0; msgReset = now }
      if (++msgCount > 30) { socket.emit('rate_limited', 'Too many messages'); return }

      const who = await ensureMember(p.roomId)
      if (!who) return
      const roomId = p.roomId as string

      const type = p.type === 'audio' ? 'audio' : 'text'
      const audioData = type === 'audio' ? safeAudio(p.audioData) : null
      if (type === 'audio' && !audioData) { socket.emit('rate_limited', 'Voice message rejected'); return }
      const content = type === 'audio' ? '🎤 voice message' : cleanText(p.content)
      if (!content) return

      const saved = await prisma.message.create({
        data: {
          id:        BigInt(nextId()),
          roomId,
          username:  who,
          content,
          type,
          audioData,
          avatar:    safeAvatar(p.avatar),
          time:      new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
          rotate:    (Math.random() * 4 - 2).toFixed(2),
          system:    false,
          isEdited:  false,
          isPinned:  false,
        },
      })
      io.to(roomId).emit('receive_message', serializeMessage(saved))
    } catch (err) {
      console.error('[Send Message Error]:', err)
    }
  })

  // the message must be in that room; delete / edit only your own
  const ownMessage = async (messageId: unknown, roomId: unknown) => {
    if (!isId(messageId)) return null
    const who = await ensureMember(roomId)
    if (!who) return null
    const msg = await prisma.message.findUnique({ where: { id: BigInt(messageId) }, select: { roomId: true, username: true } })
    if (!msg || msg.roomId !== roomId) return null
    return { who, mine: msg.username === who }
  }

  socket.on('delete_message', async (p: { messageId?: unknown; roomId?: unknown } = {}) => {
    try {
      const m = await ownMessage(p.messageId, p.roomId)
      if (!m?.mine) return
      await prisma.message.delete({ where: { id: BigInt(p.messageId as number) } })
      io.to(p.roomId as string).emit('message_deleted', { messageId: p.messageId })
    } catch (err) { console.error(err) }
  })

  socket.on('edit_message', async (p: { messageId?: unknown; roomId?: unknown; newContent?: unknown } = {}) => {
    try {
      const newContent = cleanText(p.newContent)
      if (!newContent) return
      const m = await ownMessage(p.messageId, p.roomId)
      if (!m?.mine) return
      await prisma.message.update({ where: { id: BigInt(p.messageId as number) }, data: { content: newContent, isEdited: true } })
      io.to(p.roomId as string).emit('message_edited', { messageId: p.messageId, newContent })
    } catch (err) { console.error(err) }
  })

  // any member can pin (it's a shared board), but only messages of that room
  socket.on('pin_message', async (p: { messageId?: unknown; roomId?: unknown; pinStatus?: unknown } = {}) => {
    try {
      const m = await ownMessage(p.messageId, p.roomId)
      if (!m) return
      const pinStatus = p.pinStatus === true
      await prisma.message.update({ where: { id: BigInt(p.messageId as number) }, data: { isPinned: pinStatus } })
      io.to(p.roomId as string).emit('message_pinned', { messageId: p.messageId, pinStatus })
    } catch (err) { console.error(err) }
  })

  // ── Reactions ──────────────────────────────────────────────────
  socket.on('react_message', async (p: { messageId?: unknown; roomId?: unknown; emoji?: unknown } = {}) => {
    if (!isId(p.messageId) || !(REACTIONS as readonly unknown[]).includes(p.emoji)) return
    const emoji = p.emoji as string
    try {
      const who = await ensureMember(p.roomId)
      if (!who) { socket.emit('react_error', 'Not in this room — reload the page'); return }
      const msg = await prisma.message.findUnique({ where: { id: BigInt(p.messageId) }, select: { reactions: true, roomId: true } })
      if (!msg || msg.roomId !== p.roomId) return

      const reactions: Reactions = { ...((msg.reactions ?? {}) as Reactions) }
      const list = reactions[emoji] ?? []
      const next = list.includes(who) ? list.filter(u => u !== who) : [...list, who]
      if (next.length) reactions[emoji] = next
      else delete reactions[emoji]

      await prisma.message.update({ where: { id: BigInt(p.messageId) }, data: { reactions } })
      io.to(p.roomId as string).emit('message_reacted', { messageId: p.messageId, reactions })
    } catch (err) {
      console.error('[React Error]:', err)
      socket.emit('react_error', 'Reaction failed (run prisma db push?)')
    }
  })

  // ── Seen flags ─────────────────────────────────────────────────
  socket.on('mark_seen', async (p: { roomId?: unknown; messageId?: unknown } = {}) => {
    if (!isId(p.messageId)) return
    try {
      const who = await ensureMember(p.roomId)
      if (!who) return
      const roomId = p.roomId as string
      const id = BigInt(p.messageId)
      const prev = await prisma.readMark.findUnique({ where: { roomId_username: { roomId, username: who } } })
      if (prev && prev.lastReadId >= id) return
      await prisma.readMark.upsert({
        where:  { roomId_username: { roomId, username: who } },
        update: { lastReadId: id },
        create: { roomId, username: who, lastReadId: id },
      })
      socket.to(roomId).emit('seen_update', { roomId, username: who, lastReadId: p.messageId })
    } catch (err) { console.error('[Seen Error]:', err) }
  })
}
