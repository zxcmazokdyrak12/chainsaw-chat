import { prisma } from './prisma.js'
import type { Reactions } from '../types.js'

export { generateCode } from './codes.js'

export const serializeMessage = (r: {
  id: bigint | number
  roomId: string
  username: string | null
  content: string | null
  type: string
  audioData: string | null
  avatar: string | null
  time: string | null
  rotate: string | null
  system: boolean
  isEdited: boolean
  isPinned: boolean
  reactions?: unknown
  mediaId?: string | null
  replyToId?: bigint | number | null
  replyPreview?: unknown
}) => ({
  id:        Number(r.id),
  username:  r.username,
  content:   r.content,
  type:      r.type,
  audioData: r.audioData,
  avatar:    r.avatar,
  time:      r.time,
  rotate:    r.rotate,
  system:    r.system,
  isEdited:  r.isEdited,
  isPinned:  r.isPinned,
  reactions: (r.reactions && typeof r.reactions === 'object' ? r.reactions : {}) as Reactions,
  media:     r.mediaId ?? null,
  replyTo:   r.replyToId != null && r.replyPreview && typeof r.replyPreview === 'object'
    ? { id: Number(r.replyToId), ...(r.replyPreview as Record<string, unknown>) }
    : null,
})

export async function getUserRooms(username: string) {
  const members = await prisma.roomMember.findMany({
    where:   { username },
    include: {
      room: { include: { _count: { select: { messages: true } } } },
    },
    orderBy: { room: { createdAt: 'asc' } },
  })
 return members.map((m: any) => ({
    id:        m.room.id,
    name:      m.room.name,
    code:      m.room.code,
    createdBy: m.room.createdBy,
    count:     m.room._count.messages,
  }))
}

export async function getRoomHistory(roomId: string) {
  const messages = await prisma.message.findMany({
    where:   { roomId },
    orderBy: { createdAt: 'asc' },
    take:    100,
  })

  const uniqueUsernames = Array.from(new Set(messages.map(m => m.username).filter(Boolean))) as string[]
  
  const [localUsers, oauthUsers] = await Promise.all([
    prisma.localUser.findMany({ where: { username: { in: uniqueUsernames } }, select: { username: true, avatar: true } }),
    prisma.chatUser.findMany({ where: { username: { in: uniqueUsernames } }, select: { username: true, avatar: true } })
  ])

  const avatarMap = new Map<string, string | null>()
  localUsers.forEach(u => avatarMap.set(u.username, u.avatar))
  oauthUsers.forEach(u => avatarMap.set(u.username, u.avatar))

  return messages.map(m => {
    const freshAvatar = m.username ? avatarMap.get(m.username) : null
    return serializeMessage({
      ...m,
      avatar: freshAvatar ?? m.avatar 
    })
  })
}
