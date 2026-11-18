import type { Express, Request, Response } from 'express'
import passport from 'passport'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { signToken } from '../lib/tokens.js'
import { CLIENT_URL, JWT_SECRET } from '../config.js'
import type { AuthUser, JwtPayload } from '../types.js'

// login / register / OAuth / avatar
export function registerAuthRoutes(app: Express) {
  // both OAuth providers end the same way: sign a token and bounce back to the client
  const oauthDone = (req: Request, res: Response) => {
    const user = req.user as AuthUser
    res.redirect(`${CLIENT_URL}?token=${signToken(user, '7d')}`)
  }

  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }))
  app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: `${CLIENT_URL}?error=auth` }), oauthDone)

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: `${CLIENT_URL}?error=auth` }), oauthDone)

  app.get('/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization
    if (!authHeader) { res.status(401).json({ error: 'No token' }); return }
    const token = authHeader.split(' ')[1]
    try {
      const user = jwt.verify(token, JWT_SECRET) as JwtPayload
      res.json(user)
    } catch {
      res.status(401).json({ error: 'Invalid token' })
    }
  })

  const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20 })
  app.use('/auth/login', authLimiter)
  app.use('/auth/register', authLimiter)

  app.post('/auth/register', async (req: Request, res: Response) => {
    const { username, password, avatar } = req.body as {
      username?: string
      password?: string
      avatar?: string
    }
    if (!username || !password) { res.status(400).json({ error: 'Username and password required' }); return }
    const name = username.trim().toUpperCase()
    if (!/^[A-ZА-ЯЁ0-9_-]{2,14}$/.test(name)) {
      res.status(400).json({ error: 'Nickname: 2-14 letters, digits, _ or -' }); return
    }
    if (password.length < 6)    { res.status(400).json({ error: 'Password min 6 characters' }); return }
    if (password.length > 72)   { res.status(400).json({ error: 'Password max 72 characters' }); return }

    try {
      const hash = await bcrypt.hash(password, 10)
      const user = await prisma.localUser.create({
        data:   { username: name, password: hash, avatar: avatar ?? null },
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
    const token = req.headers.authorization?.split(' ')[1]
    const { avatar } = req.body as { avatar?: string }
    if (!token || !avatar || avatar.length > 300) { res.status(400).json({ error: 'Bad request' }); return }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
      const local = await prisma.localUser.findUnique({ where: { username: payload.username } })
      if (!local || local.id !== payload.id) { res.status(404).json({ error: 'Not a local account' }); return }
      await prisma.localUser.update({ where: { id: local.id }, data: { avatar } })
      const fresh = signToken({ id: local.id, username: local.username, avatar }, '30d')
      res.json({ token: fresh })
    } catch {
      res.status(401).json({ error: 'Invalid token' })
    }
  })

  app.post('/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body as { username?: string; password?: string }
    if (!username || !password) { res.status(400).json({ error: 'Username and password required' }); return }

    try {
      const user = await prisma.localUser.findUnique({ where: { username: username.trim().toUpperCase() } })
      // одна и та же ошибка для "нет юзера" и "не тот пароль" — не подсказываем, какие ники заняты
      const valid = user ? await bcrypt.compare(password, user.password) : false
      if (!user || !valid) { res.status(400).json({ error: 'Wrong nickname or password' }); return }

      const token = signToken({ id: user.id, username: user.username, avatar: user.avatar }, '30d')
      res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } })
    } catch {
      res.status(500).json({ error: 'Server error' })
    }
  })
}
