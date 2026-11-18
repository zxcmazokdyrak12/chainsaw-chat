import express, { type Express, type Request, type Response } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { prisma } from '../lib/prisma.js'
import { readToken } from '../lib/tokens.js'
import { isRoomId } from '../lib/validate.js'
import { saveMedia, loadMedia } from '../lib/storage.js'
import { sniff } from '../lib/sniff.js'
import { PUBLIC_ROOM } from '../config.js'

export const MAX_UPLOAD = 2_500_000 // the client shrinks pictures to ~300 KB; voice notes are small too

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v)

// upload a picture / voice note into a room, read it back by its (unguessable) id
export function registerMediaRoutes(app: Express) {
  const uploadLimiter = rateLimit({
    windowMs: 10 * 60_000, max: 40, standardHeaders: true, legacyHeaders: false,
    keyGenerator: (req) => readToken(req)?.username ?? ipKeyGenerator(req.ip ?? ''),
  })

  app.post('/media', uploadLimiter, express.raw({ type: '*/*', limit: MAX_UPLOAD }), async (req: Request, res: Response) => {
    const user = readToken(req)
    if (!user) { res.status(401).json({ error: 'Log in first' }); return }
    const roomId = String(req.query.roomId ?? '')
    if (!isRoomId(roomId)) { res.status(400).json({ error: 'Bad room' }); return }
    const body = req.body
    if (!Buffer.isBuffer(body) || !body.length) { res.status(400).json({ error: 'Empty file' }); return }
    const mime = sniff(body)
    if (!mime) { res.status(415).json({ error: 'Only webp / jpeg / png / gif pictures and webm / ogg / m4a / mp3 audio' }); return }
    try {
      if (roomId !== PUBLIC_ROOM) {
        const member = await prisma.roomMember.findUnique({ where: { roomId_username: { roomId, username: user.username } } })
        if (!member) { res.status(403).json({ error: 'You are not in this room' }); return }
      }
      const id = await saveMedia({ roomId, username: user.username, mime, data: body })
      res.json({ id, mime })
    } catch (err) {
      console.error('[Upload Error]:', err)
      res.status(500).json({ error: 'Upload failed' })
    }
  })

  app.get('/media/:id', async (req: Request, res: Response) => {
    const id = String(req.params.id)
    if (!isUuid(id)) { res.status(404).end(); return }
    try {
      const file = await loadMedia(id)
      if (!file) { res.status(404).end(); return }
      res.set({
        'Content-Type': file.mime,
        'Content-Length': String(file.data.length),
        'Cache-Control': 'private, max-age=31536000, immutable',
        'Content-Disposition': 'inline',
        // the chat (another origin) must be able to show it; nothing in it can run
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      })
      res.end(file.data)
    } catch (err) {
      console.error('[Media Error]:', err)
      res.status(500).end()
    }
  })
}
