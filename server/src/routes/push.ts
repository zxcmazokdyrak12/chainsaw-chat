import type { Express, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { readToken } from '../lib/tokens.js'
import { isPushEndpoint } from '../lib/webpush.js'
import { VAPID, pushEnabled } from '../lib/push.js'

const isKey = (v: unknown, len: number) => typeof v === 'string' && /^[A-Za-z0-9_-]+$/.test(v) && Buffer.from(v, 'base64url').length === len

// push notifications when the tab is closed (accounts only: guest names don't outlive the tab)
export function registerPushRoutes(app: Express) {
  app.get('/push/key', (_req: Request, res: Response) => {
    if (!pushEnabled()) { res.status(404).json({ error: 'Push is not configured on this server' }); return }
    res.json({ key: VAPID.publicKey })
  })

  app.post('/push/subscribe', async (req: Request, res: Response) => {
    const user = readToken(req)
    if (!user) { res.status(401).json({ error: 'Log in first' }); return }
    if (user.guest) { res.status(403).json({ error: 'Push needs an account' }); return }
    if (!pushEnabled()) { res.status(404).json({ error: 'Push is not configured' }); return }
    const { endpoint, keys } = (req.body ?? {}) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
    if (!isPushEndpoint(endpoint) || !isKey(keys?.p256dh, 65) || !isKey(keys?.auth, 16)) { res.status(400).json({ error: 'Bad subscription' }); return }
    try {
      await prisma.pushSubscription.upsert({
        where: { endpoint },
        update: { username: user.username, p256dh: keys!.p256dh as string, auth: keys!.auth as string },
        create: { endpoint, username: user.username, p256dh: keys!.p256dh as string, auth: keys!.auth as string },
      })
      // a person keeps at most 5 devices
      const all = await prisma.pushSubscription.findMany({ where: { username: user.username }, orderBy: { createdAt: 'desc' }, select: { id: true } })
      if (all.length > 5) await prisma.pushSubscription.deleteMany({ where: { id: { in: all.slice(5).map((s: { id: number }) => s.id) } } })
      res.json({ ok: true })
    } catch { res.status(500).json({ error: 'Server error' }) }
  })

  app.post('/push/unsubscribe', async (req: Request, res: Response) => {
    const user = readToken(req)
    if (!user) { res.status(401).json({ error: 'Log in first' }); return }
    const endpoint = (req.body ?? {}).endpoint
    if (!isPushEndpoint(endpoint)) { res.status(400).json({ error: 'Bad endpoint' }); return }
    await prisma.pushSubscription.deleteMany({ where: { endpoint, username: user.username } }).catch(() => {})
    res.json({ ok: true })
  })
}
