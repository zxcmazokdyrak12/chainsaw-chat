import type { Express, Request, Response } from 'express'
import crypto from 'crypto'
import passport from 'passport'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { readToken, signGuestToken, signToken } from '../lib/tokens.js'
import { NICK_RE, normalizeNick, safeAvatar } from '../lib/validate.js'
import { isOnline } from '../sockets/state.js'
import { CLIENT_URL } from '../config.js'
import type { AuthUser } from '../types.js'

// is this nickname owned by a registered account (either kind)? case-insensitive
async function nameTaken(name: string): Promise<boolean> {
  const [local, oauth] = await Promise.all([
    prisma.localUser.findFirst({ where: { username: { equals: name, mode: 'insensitive' } }, select: { id: true } }),
    prisma.chatUser.findFirst({ where: { username: { equals: name, mode: 'insensitive' } }, select: { id: true } }),
  ])
  return !!(local || oauth)
}

// login / register / guest / OAuth / avatar
export function registerAuthRoutes(app: Express) {
  // both OAuth providers end the same way: sign a token and bounce back to the client.
  // The token goes in the #fragment: fragments never reach servers, logs or Referer headers.
  const oauthDone = (req: Request, res: Response) => {
    const user = req.user as AuthUser
    req.logout?.(() => {})
    res.redirect(`${CLIENT_URL}/#token=${signToken(user, '7d')}`)
  }

  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }))
  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: `${CLIENT_URL}/?error=auth` }), oauthDone)

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/?error=auth` }), oauthDone)

  app.get('/auth/me', (req: Request, res: Response) => {
    const user = readToken(req)
    if (!user) { res.status(401).json({ error: 'Invalid token' }); return }
    res.json(user)
  })

  const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, standardHeaders: true, legacyHeaders: false })
  app.use(['/auth/login', '/auth/register', '/auth/guest'], authLimiter)

  // guest = a signed, short-lived name; refuses names of accounts and of people online right now
  app.post('/auth/guest', async (req: Request, res: Response) => {
    const name = normalizeNick(req.body?.username)
    if (!NICK_RE.test(name)) { res.status(400).json({ error: 'Nickname: 2-14 letters, digits, _ or -' }); return }
    try {
      if (isOnline(name) || await nameTaken(name)) {
        res.status(409).json({ error: 'That name is taken — pick another' }); return
      }
      const token = signGuestToken(name, safeAvatar(req.body?.avatar), crypto.randomUUID())
      res.json({ token, user: { username: name, avatar: safeAvatar(req.body?.avatar), guest: true } })
    } catch {
      res.status(500).json({ error: 'Server error' })
    }
  })

  app.post('/auth/register', async (req: Request, res: Response) => {
    const { password } = (req.body ?? {}) as { password?: unknown }
    const name = normalizeNick(req.body?.username)
    if (!name || typeof password !== 'string') { res.status(400).json({ error: 'Username and password required' }); return }
    if (!NICK_RE.test(name)) { res.status(400).json({ error: 'Nickname: 2-14 letters, digits, _ or -' }); return }
    if (password.length < 8)  { res.status(400).json({ error: 'Password min 8 characters' }); return }
    if (password.length > 72) { res.status(400).json({ error: 'Password max 72 characters' }); return }

    try {
      if (isOnline(name) || await nameTaken(name)) { res.status(400).json({ error: 'Username already taken' }); return }
      const hash = await bcrypt.hash(password, 12)
      const user = await prisma.localUser.create({
        data:   { username: name, password: hash, avatar: safeAvatar(req.body?.avatar) },
        select: { id: true, username: true, avatar: true },
      })
      const token = signToken({ id: user.id, username: user.username, avatar: user.avatar }, '30d')
      res.json({ token, user })
    } catch (err: any) {
      if (err?.code === 'P2002') { res.status(400).json({ error: 'Username already taken' }); return }
      res.status(500).json({ error: 'Server error' })
    }
  })

  // аватар для аккаунта по логину/паролю — чтобы выбранный персонаж сохранялся между входами
  app.post('/auth/avatar', async (req: Request, res: Response) => {
    const payload = readToken(req)
    if (!payload) { res.status(401).json({ error: 'Invalid token' }); return }
    if (payload.guest) { res.status(403).json({ error: 'Guests have no account' }); return }
    const avatar = safeAvatar(req.body?.avatar)
    if (!avatar) { res.status(400).json({ error: 'Bad avatar' }); return }
    try {
      const local = await prisma.localUser.findUnique({ where: { username: payload.username } })
      if (!local || local.id !== payload.id) { res.status(404).json({ error: 'Not a local account' }); return }
      await prisma.localUser.update({ where: { id: local.id }, data: { avatar } })
      res.json({ token: signToken({ id: local.id, username: local.username, avatar }, '30d') })
    } catch {
      res.status(500).json({ error: 'Server error' })
    }
  })

  // a bcrypt hash of a random password: unknown nicknames take as long to check as real ones,
  // so response time doesn't tell which nicknames exist
  const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 12)

  app.post('/auth/login', async (req: Request, res: Response) => {
    const { password } = (req.body ?? {}) as { password?: unknown }
    const name = normalizeNick(req.body?.username)
    if (!name || typeof password !== 'string' || password.length > 72) {
      res.status(400).json({ error: 'Username and password required' }); return
    }
    try {
      const user = await prisma.localUser.findUnique({ where: { username: name } })
      const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH)
      // одна и та же ошибка для "нет юзера" и "не тот пароль" — не подсказываем, какие ники заняты
      if (!user || !valid) { res.status(400).json({ error: 'Wrong nickname or password' }); return }

      const token = signToken({ id: user.id, username: user.username, avatar: user.avatar }, '30d')
      res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } })
    } catch {
      res.status(500).json({ error: 'Server error' })
    }
  })
}
