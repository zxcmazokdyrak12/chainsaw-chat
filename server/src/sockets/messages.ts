import { prisma } from '../lib/prisma.js'
import { serializeMessage } from '../lib/rooms.js'
import { REACTIONS, type Reactions, type SendMessagePayload } from '../types.js'
import type { SocketCtx } from './context.js'

// sending, editing, pinning, reacting, read marks
export function registerMessagesHandlers({ io, socket, data, ensureMember }: SocketCtx) {
  // ── FIX CLEANED UP SEND_MESSAGE ────────────────────────────────
  socket.on('send_message', async (payload: SendMessagePayload) => {
    try {
      const { roomId, username, content, type = 'text', audioData, avatar } = payload

      const now = Date.now()
      if (!data.msgCount) data.msgCount = 0
      if (!data.msgReset) data.msgReset = now
      if (now - data.msgReset > 60_000) { data.msgCount = 0; data.msgReset = now }
      data.msgCount++
      if (data.msgCount > 30) { socket.emit('rate_limited', 'Too many messages'); return }

      // Сохраняем в базу. Поле id опускаем, если в схеме Prisma стоит автогенерация/default,
      // Либо используем BigInt(Date.now()), но ОДИН раз за вызов функции.
      const savedMessage = await prisma.message.create({
        data: {
          id:        BigInt(Date.now()), // Оставляем BigInt, если в бд ручной id
          roomId,
          username,
          content:   content ?? '',
          type,
          audioData: audioData ?? null,
          avatar:    avatar ?? null,
          time:      new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
          rotate:    (Math.random() * 4 - 2).toFixed(2),
          system:    false,
          isEdited:  false,
          isPinned:  false,
        }
      })

      io.to(roomId).emit('receive_message', serializeMessage(savedMessage))
    } catch (err) {
      console.error('[Send Message Error]:', err)
    }
  })

  socket.on('delete_message', async ({ messageId, roomId }: { messageId: number; roomId: string }) => {
    try {
      await prisma.message.delete({ where: { id: BigInt(messageId) } })
      io.to(roomId).emit('message_deleted', { messageId })
    } catch (err) { console.error(err) }
  })

  socket.on('edit_message', async ({ messageId, roomId, newContent }: { messageId: number; roomId: string; newContent: string }) => {
    try {
      await prisma.message.update({
        where: { id: BigInt(messageId) },
        data:  { content: newContent, isEdited: true },
      })
      io.to(roomId).emit('message_edited', { messageId, newContent })
    } catch (err) { console.error(err) }
  })

  socket.on('pin_message', async ({ messageId, roomId, pinStatus }: { messageId: number; roomId: string; pinStatus: boolean }) => {
    try {
      await prisma.message.update({
        where: { id: BigInt(messageId) },
        data:  { isPinned: pinStatus },
      })
      io.to(roomId).emit('message_pinned', { messageId, pinStatus })
    } catch (err) { console.error(err) }
  })

  // ── Reactions ──────────────────────────────────────────────────
  socket.on('react_message', async ({ messageId, roomId, emoji, username }: { messageId: number; roomId: string; emoji: string; username?: string }) => {
    const who = ensureMember(roomId, username)
    if (!who) { socket.emit('react_error', 'Not in a room — reload the page'); return }
    if (!(REACTIONS as readonly string[]).includes(emoji)) return
    try {
      const msg = await prisma.message.findUnique({ where: { id: BigInt(messageId) }, select: { reactions: true, roomId: true } })
      if (!msg || msg.roomId !== roomId) return

      const reactions: Reactions = { ...((msg.reactions ?? {}) as Reactions) }
      const list = reactions[emoji] ?? []
      const next = list.includes(who) ? list.filter(u => u !== who) : [...list, who]
      if (next.length) reactions[emoji] = next
      else delete reactions[emoji]

      await prisma.message.update({ where: { id: BigInt(messageId) }, data: { reactions } })
      io.to(roomId).emit('message_reacted', { messageId, reactions })
    } catch (err) {
      console.error('[React Error]:', err)
      socket.emit('react_error', 'Reaction failed (run prisma db push?)')
    }
  })

  // ── Seen flags ─────────────────────────────────────────────────
  socket.on('mark_seen', async ({ roomId, messageId, username }: { roomId: string; messageId: number; username?: string }) => {
    const who = ensureMember(roomId, username)
    if (!who || !roomId || !messageId) return
    try {
      const id = BigInt(messageId)
      const prev = await prisma.readMark.findUnique({ where: { roomId_username: { roomId, username: who } } })
      if (prev && prev.lastReadId >= id) return
      await prisma.readMark.upsert({
        where:  { roomId_username: { roomId, username: who } },
        update: { lastReadId: id },
        create: { roomId, username: who, lastReadId: id },
      })
      socket.to(roomId).emit('seen_update', { roomId, username: who, lastReadId: messageId })
    } catch (err) { console.error('[Seen Error]:', err) }
  })
}
