import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
import express from 'express'
import type { Request, Response, NextFunction } from 'express' 
import { createServer } from 'http'
import { Server } from 'socket.io'
import type { Socket } from 'socket.io' 
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import passport from 'passport'
import passportGitHub from 'passport-github2'
import passportGoogle from 'passport-google-oauth20'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import session from 'express-session'

// separate strategy imports for clarity
const GitHubStrategy = passportGitHub.Strategy;
const GoogleStrategy = passportGoogle.Strategy;

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})

const app = express()

// ── FIX ДЛЯ RENDER (EXPRESS-RATE-LIMIT) ──────────────────────────
app.set('trust proxy', 1) 

// ── Types ────────────────────────────────────────────────────────

interface AuthUser {
  id: number
  username: string
  avatar: string | null
  email?: string | null
}

interface JwtPayload {
  id: number
  username: string
  avatar: string | null
  email?: string | null
}

interface SocketData {
  currentRoom?: string
  username?: string
  msgCount?: number
  msgReset?: number
}

interface SendMessagePayload {
  roomId: string
  username: string
  content?: string
  type?: string
  audioData?: string
  avatar?: string
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'CHAINSAW_REZE_DENJI_LOVE_2025'
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'

// ── Middleware ───────────────────────────────────────────────────

app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(helmet())
app.use(rateLimit({ windowMs: 60_000, max: 100 }))
app.use(express.json())
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())

// ── Passport ─────────────────────────────────────────────────────

passport.serializeUser((user: any, done: any) => done(null, user))
passport.deserializeUser((user: any, done: any) => done(null, user))

// GitHub
passport.use(new GitHubStrategy(
  {
    clientID:     process.env.GITHUB_CLIENT_ID     || 'fake-github-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'fake-github-secret',
    callbackURL:  'https://chainsaw-chat.onrender.com/auth/github/callback',
  },
  async (
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: Error | null, user?: AuthUser) => void
  ) => {
    try {
      const user = await prisma.chatUser.upsert({
        where:  { provider_providerId: { provider: 'github', providerId: profile.id } },
        update: {
          username: profile.displayName ?? (profile as any).username ?? 'Unknown',
          avatar:   profile.photos?.[0]?.value ?? null,
        },
        create: {
          provider:   'github',
          providerId: profile.id,
          username:   profile.displayName ?? (profile as any).username ?? 'Unknown',
          avatar:     profile.photos?.[0]?.value ?? null,
          email:      profile.emails?.[0]?.value ?? null,
        },
      })
      return done(null, { id: user.id, username: user.username, avatar: user.avatar, email: user.email })
    } catch (err) {
      return done(err as Error)
    }
  }
))

// Google
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID     || 'fake-google-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'fake-google-secret',
    callbackURL:  'https://chainsaw-chat.onrender.com/auth/google/callback',
  },
  async (
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: Error | null, user?: AuthUser) => void
  ) => {
    try {
      const user = await prisma.chatUser.upsert({
        where:  { provider_providerId: { provider: 'google', providerId: profile.id } },
        update: {
          username: profile.displayName,
          avatar:   profile.photos?.[0]?.value ?? null,
        },
        create: {
          provider:   'google',
          providerId: profile.id,
          username:   profile.displayName,
          avatar:     profile.photos?.[0]?.value ?? null,
          email:      profile.emails?.[0]?.value ?? null,
        },
      })
      return done(null, { id: user.id, username: user.username, avatar: user.avatar, email: user.email })
    } catch (err) {
      return done(err as Error)
    }
  }
))

// ── Helpers ──────────────────────────────────────────────────────

const SYLLABLES = [
  'KAI','ZEN','RYU','KEN','MAI','SHI','DEN','AKI',
  'REZ','POW','CUT','SAW','DEV','HUN','CHI','BLO',
]

const generateCode = (): string => {
  const a = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
  const b = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
  const n = Math.floor(Math.random() * 99).toString().padStart(2, '0')
  return `${a}${b}${n}`
}

const serializeMessage = (r: {
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
})

async function getUserRooms(username: string) {
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

async function getRoomHistory(roomId: string) {
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

// ── Auth routes ──────────────────────────────────────────────────

app.get('/ping', (_req: Request, res: Response) => res.send('ok'))

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }))
app.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: `${CLIENT_URL}?error=auth` }),
  (req: Request, res: Response) => {
    const user = req.user as AuthUser
    const token = jwt.sign(
      { id: user.id, username: user.username, avatar: user.avatar, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.redirect(`${CLIENT_URL}?token=${token}`)
  }
)

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}?error=auth` }),
  (req: Request, res: Response) => {
    const user = req.user as AuthUser
    const token = jwt.sign(
      { id: user.id, username: user.username, avatar: user.avatar, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.redirect(`${CLIENT_URL}?token=${token}`)
  }
)

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

app.post('/auth/register', async (req: Request, res: Response) => {
  const { username, password, avatar } = req.body as {
    username?: string
    password?: string
    avatar?: string
  }
  if (!username || !password) { res.status(400).json({ error: 'Username and password required' }); return }
  if (password.length < 6)    { res.status(400).json({ error: 'Password min 6 characters' }); return }

  try {
    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.localUser.create({
      data:   { username: username.toUpperCase(), password: hash, avatar: avatar ?? null },
      select: { id: true, username: true, avatar: true },
    })
    const token = jwt.sign(
      { id: user.id, username: user.username, avatar: user.avatar },
      JWT_SECRET,
      { expiresIn: '30d' }
    )
    res.json({ token, user })
  } catch (err: any) {
    if (err?.code === 'P2002') { res.status(400).json({ error: 'Username already taken' }); return }
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string }
  if (!username || !password) { res.status(400).json({ error: 'Username and password required' }); return }

  try {
    const user = await prisma.localUser.findUnique({ where: { username: username.toUpperCase() } })
    if (!user) { res.status(400).json({ error: 'User not found' }); return }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) { res.status(400).json({ error: 'Wrong password' }); return }

    const token = jwt.sign(
      { id: user.id, username: user.username, avatar: user.avatar },
      JWT_SECRET,
      { expiresIn: '30d' }
    )
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Socket.io ────────────────────────────────────────────────────

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'], credentials: true },
  maxHttpBufferSize: 5e6,
})

const typingUsers: Record<string, Record<string, string>> = {}

io.on('connection', (socket: Socket) => {
  const data = socket.data as SocketData
  console.log('connected:', socket.id)

  socket.on('get_rooms', async ({ username }: { username: string }) => {
    const list = await getUserRooms(username)
    socket.emit('rooms_list', list)
  })

  socket.on('create_room', async ({ username, roomName }: { username: string; roomName?: string }) => {
    try {
      const code = generateCode()
      const id   = code.toLowerCase()
      const name = roomName ? `# ${roomName.toUpperCase().slice(0, 16)}` : `# ROOM-${code}`

      await prisma.room.create({ data: { id, name, code, createdBy: username } })
      await prisma.roomMember.create({ data: { roomId: id, username } })

      const list = await getUserRooms(username)
      socket.emit('rooms_list', list)
      socket.emit('room_created', { id, code, name })
    } catch (err) {
      console.error(err)
    }
  })

  socket.on('join_by_code', async ({ code, username }: { code: string; username: string }) => {
    try {
      const room = await prisma.room.findFirst({
        where: { code: { equals: code, mode: 'insensitive' } },
      })
      if (!room) { socket.emit('join_error', 'Room not found'); return }

      await prisma.roomMember.upsert({
        where:  { roomId_username: { roomId: room.id, username } },
        update: {},
        create: { roomId: room.id, username },
      })

      const list = await getUserRooms(username)
      socket.emit('rooms_list', list)
      socket.emit('join_by_code_success', { roomId: room.id })
    } catch (err) {
      console.error(err)
      socket.emit('join_error', 'Server error')
    }
  })

  socket.on('join_room', async ({ roomId, username }: { roomId: string; username: string }) => {
    socket.rooms.forEach(room => { if (room !== socket.id) socket.leave(room) })
    socket.join(roomId)
    data.currentRoom = roomId
    data.username    = username

    const history = await getRoomHistory(roomId)
    socket.emit('room_history', history)
    socket.to(roomId).emit('user_joined', { username, roomId })
  })

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

  socket.on('typing_start', ({ roomId, username }: { roomId: string; username: string }) => {
    if (!typingUsers[roomId]) typingUsers[roomId] = {}
    typingUsers[roomId][socket.id] = username
    socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
  })

  socket.on('typing_stop', ({ roomId }: { roomId: string }) => {
    if (typingUsers[roomId]) {
      delete typingUsers[roomId][socket.id]
      socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
    }
  })

  socket.on('disconnect', async () => {
    const roomId   = data.currentRoom
    const username = data.username

    if (roomId && typingUsers[roomId]) {
      delete typingUsers[roomId][socket.id]
      socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
    }

    if (username) {
      try {
        const oauthUser = await prisma.chatUser.findFirst({ where: { username } })
        if (!oauthUser) {
          await prisma.roomMember.deleteMany({ where: { username } })
          console.log(`[🧹 PURGE] Guest ${username} removed`)
        } else {
          console.log(`[💾 KEEP] OAuth user ${username} disconnected`)
        }
      } catch (err) { console.error('[Disconnect Error]:', err) }
    }

    console.log('disconnected:', socket.id)
  })
})

// ── Start ────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => console.log(`🔥 server: http://localhost:${PORT}`))