import { prisma } from './prisma.js'
import { encryptPayload, vapidAuthorization } from './webpush.js'
import { isOnline } from '../sockets/state.js'
import { PUBLIC_ROOM } from '../config.js'

export const VAPID = {
  publicKey: process.env.VAPID_PUBLIC_KEY ?? '',
  privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
  subject: process.env.VAPID_SUBJECT ?? 'mailto:admin@chainsaw-chat.app',
}
export const pushEnabled = () => !!(VAPID.publicKey && VAPID.privateKey)

interface PushPayload { title: string; body: string; roomId: string; tag?: string }

async function sendOne(sub: { id: number; endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  const body = encryptPayload(Buffer.from(JSON.stringify(payload)), sub.p256dh, sub.auth)
  const r = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapidAuthorization(sub.endpoint, VAPID),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '3600',
      Urgency: 'normal',
    },
    body: new Uint8Array(body),
  })
  // gone for good → forget the subscription
  if (r.status === 404 || r.status === 410) await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
}

// one push per person per room every 30 s at most — a burst of messages is one notification
const lastPush = new Map<string, number>()
const QUIET = 30_000

// people who are not connected right now get a push:
//   • private rooms: every member      • the lobby: only people @mentioned
export async function pushNewMessage(m: { roomId: string; roomName: string; from: string; text: string; mentioned: string[] }) {
  if (!pushEnabled()) return
  try {
    const targets: string[] = m.roomId === PUBLIC_ROOM
      ? m.mentioned
      : (await prisma.roomMember.findMany({ where: { roomId: m.roomId }, select: { username: true } })).map((x: { username: string }) => x.username)
    const now = Date.now()
    const offline = [...new Set(targets)].filter(u => u !== m.from && !isOnline(u)).filter(u => {
      const key = `${u}:${m.roomId}`
      if (now - (lastPush.get(key) ?? 0) < QUIET && !m.mentioned.includes(u.toUpperCase())) return false
      lastPush.set(key, now)
      return true
    })
    if (!offline.length) return
    if (lastPush.size > 10_000) lastPush.clear()
    const subs = await prisma.pushSubscription.findMany({ where: { username: { in: offline } } })
    const text = m.text.replace(/\|\|[\s\S]+?\|\|/g, '█████').slice(0, 140) // spoilers stay hidden on the lock screen
    await Promise.allSettled(subs.map((s: { id: number; endpoint: string; p256dh: string; auth: string; username: string }) => sendOne(s, {
      title: m.mentioned.includes(s.username.toUpperCase()) ? `${m.from} mentioned you in ${m.roomName}` : `${m.from} · ${m.roomName}`,
      body: text,
      roomId: m.roomId,
      tag: m.roomId,
    })))
  } catch (err) { console.error('[Push Error]:', (err as Error).message) }
}
