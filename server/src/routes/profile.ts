import type { Express, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { readToken } from '../lib/tokens.js'

// service record stats + the character page
const PAGE_FIELDS = ['contract', 'likes', 'dislikes', 'dream', 'favChapter'] as const
type PageField = typeof PAGE_FIELDS[number]

export function registerProfileRoutes(app: Express) {
  app.get('/profile/:username', async (req: Request, res: Response) => {
    // as stored: account nicknames are upper-case, OAuth names keep their case
    const username = String(req.params.username || '').trim().slice(0, 64)
    if (!username) { res.status(400).json({ error: 'Username required' }); return }
    try {
      // one pass over the user's lines: total, shouts (CAPS with 3+ letters), first appearance
      const [agg] = await prisma.$queryRaw<{ lines: number; shouts: number; first_seen: Date | null }[]>`
        SELECT COUNT(*)::int AS lines,
               COUNT(*) FILTER (
                 WHERE type = 'text' AND content = UPPER(content)
                   AND LENGTH(REGEXP_REPLACE(content, '[^A-Za-zА-Яа-яЁё]', '', 'g')) > 2
               )::int AS shouts,
               MIN(created_at) AS first_seen
        FROM messages
        WHERE username = ${username} AND system = false`
      // every name inside every reaction list on this user's messages
      const [rx] = await prisma.$queryRaw<{ reactions: number }[]>`
        SELECT COALESCE(SUM(jsonb_array_length(r.value)), 0)::int AS reactions
        FROM messages m, jsonb_each(m.reactions::jsonb) r
        WHERE m.username = ${username} AND jsonb_typeof(r.value) = 'array'`

      const [chapters, local, oauth, page] = await Promise.all([
        prisma.roomMember.count({ where: { username } }),
        prisma.localUser.findUnique({ where: { username }, select: { avatar: true, createdAt: true } }),
        prisma.chatUser.findFirst({ where: { username }, select: { avatar: true, createdAt: true } }),
        prisma.userProfile.findUnique({ where: { username } }),
      ])

      const starts = [agg?.first_seen, local?.createdAt, oauth?.createdAt].filter(Boolean) as Date[]
      const since = starts.length ? new Date(Math.min(...starts.map(d => d.getTime()))) : null
      const daysOnDuty = since ? Math.max(1, Math.ceil((Date.now() - since.getTime()) / 86_400_000)) : 0

      res.json({
        username,
        avatar: local?.avatar ?? oauth?.avatar ?? null,
        stats: {
          lines: agg?.lines ?? 0,
          shouts: agg?.shouts ?? 0,
          reactions: rx?.reactions ?? 0,
          chapters,
          daysOnDuty,
          since,
        },
        page: Object.fromEntries(PAGE_FIELDS.map(k => [k, page?.[k] ?? ''])),
      })
    } catch (err) {
      console.error('[Profile Error]:', err)
      res.status(500).json({ error: 'Server error' })
    }
  })

  // fill in your own character page (needs a login token, guests can only read)
  app.put('/profile', async (req: Request, res: Response) => {
    if (!req.headers.authorization) { res.status(401).json({ error: 'Log in to edit your page' }); return }
    const payload = readToken(req)
    if (!payload) { res.status(401).json({ error: 'Invalid token' }); return }

    const body = (req.body ?? {}) as Partial<Record<PageField, unknown>>
    const data: Partial<Record<PageField, string>> = {}
    for (const k of PAGE_FIELDS) {
      if (typeof body[k] === 'string') data[k] = (body[k] as string).trim().slice(0, 40)
    }
    try {
      const page = await prisma.userProfile.upsert({
        where:  { username: payload.username },
        update: data,
        create: { username: payload.username, ...data },
      })
      res.json({ page: Object.fromEntries(PAGE_FIELDS.map(k => [k, page[k] ?? ''])) })
    } catch (err) {
      console.error('[Profile Save Error]:', err)
      res.status(500).json({ error: 'Server error' })
    }
  })
}
