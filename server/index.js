import 'dotenv/config';
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import passport from 'passport'
import { Strategy as GitHubStrategy } from 'passport-github2'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import session from 'express-session'
import jwt from 'jsonwebtoken'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function initDB() {
  // Инициализация таблицы пользователей
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_users (
      id SERIAL PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar TEXT,
      email TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(provider, provider_id)
    )
  `)

  // Инициализация таблицы комнат
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  // Таблица связей пользователей и комнат (для приватности)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS room_members (
      room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
      username TEXT,
      joined_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (room_id, username)
    )
  `)

  // Инициализация таблицы сообщений с поддержкой редактирования и закрепов
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGINT PRIMARY KEY,
      room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
      username TEXT,
      content TEXT,
      type TEXT DEFAULT 'text',
      audio_data TEXT,
      avatar TEXT,
      time TEXT,
      rotate TEXT,
      system BOOLEAN DEFAULT FALSE,
      is_edited BOOLEAN DEFAULT FALSE,
      is_pinned BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  console.log('DB is ready')
}

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))
app.use(helmet())
app.use(rateLimit({ windowMs: 60000, max: 100 }))
app.use(express.json())
app.use(session({
  secret: process.env.JWT_SECRET || 'CHAINSAW_REZE_DENJI_LOVE_2025',
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

// ── GitHub Strategy ──────────────────────────────
passport.use(new GitHubStrategy({
  clientID:     process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL:  'https://chainsaw-chat.onrender.com/auth/github/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const result = await pool.query(`
      INSERT INTO chat_users (provider, provider_id, username, avatar, email)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (provider, provider_id)
      DO UPDATE SET username = $3, avatar = $4
      RETURNING *
    `, [
      'github',
      profile.id,
      profile.displayName || profile.username,
      profile.photos?.[0]?.value || null,
      profile.emails?.[0]?.value || null,
    ])

    const user = {
      id: result.rows[0].id,
      username: result.rows[0].username,
      avatar: result.rows[0].avatar,
      email: result.rows[0].email
    }
    return done(null, user)
  } catch (err) {
    return done(err)
  }
}))

// ── Google Strategy ──────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  'https://chainsaw-chat.onrender.com/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const result = await pool.query(`
      INSERT INTO chat_users (provider, provider_id, username, avatar, email)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (provider, provider_id)
      DO UPDATE SET username = $3, avatar = $4
      RETURNING *
    `, [
      'google',
      profile.id,
      profile.displayName,
      profile.photos?.[0]?.value || null,
      profile.emails?.[0]?.value || null,
    ])

    const user = {
      id: result.rows[0].id,
      username: result.rows[0].username,
      avatar: result.rows[0].avatar,
      email: result.rows[0].email
    }
    return done(null, user)
  } catch (err) {
    return done(err)
  }
}))

// ── Auth routes ──────────────────────────────────
app.get('/ping', (req, res) => res.send('ok'))

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }))
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL}?error=auth` }),
  (req, res) => {
    const payload = { id: req.user.id, username: req.user.username, avatar: req.user.avatar, email: req.user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'CHAINSAW_REZE_DENJI_LOVE_2025', { expiresIn: '7d' });
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  }
)

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}?error=auth` }),
  (req, res) => {
    const payload = { id: req.user.id, username: req.user.username, avatar: req.user.avatar, email: req.user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'CHAINSAW_REZE_DENJI_LOVE_2025', { expiresIn: '7d' });
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  }
)

app.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })
  const token = authHeader.split(' ')[1]
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET)
    res.json(user)
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// ── Socket.io ────────────────────────────────────
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'], credentials: true }
})

const typingUsers = {}
const SYLLABLES = ['KAI','ZEN','RYU','KEN','MAI','SHI','DEN','AKI','REZ','POW','CUT','SAW','DEV','HUN','CHI','BLO']

const generateCode = () => {
  const a = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
  const b = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
  const n = Math.floor(Math.random() * 99).toString().padStart(2, '0')
  return `${a}${b}${n}`
}

// Получение списка комнат, доступных конкретному юзеру
async function getUserRooms(username) {
  if (!username) return []
  const result = await pool.query(`
    SELECT r.id, r.name, r.code, r.created_by, COUNT(m.id) as count
    FROM rooms r
    JOIN room_members rm ON r.id = rm.room_id
    LEFT JOIN messages m ON m.room_id = r.id
    WHERE rm.username = $1
    GROUP BY r.id, r.name, r.code, r.created_by, r.created_at
    ORDER BY r.created_at ASC
  `, [username])
  return result.rows.map(r => ({
    id: r.id, name: r.name, code: r.code,
    createdBy: r.created_by, count: parseInt(r.count)
  }))
}

async function getRoomHistory(roomId) {
  const result = await pool.query(`
    SELECT * FROM messages WHERE room_id = $1
    ORDER BY created_at ASC LIMIT 100
  `, [roomId])
  return result.rows.map(r => ({
    id: r.id, username: r.username, content: r.content,
    type: r.type, audioData: r.audio_data, avatar: r.avatar,
    time: r.time, rotate: r.rotate, system: r.system, roomId: r.room_id,
    isEdited: r.is_edited, isPinned: r.is_pinned
  }))
}

io.on('connection', async (socket) => {
  console.log('подключился:', socket.id)

  // Запрос списка комнат пользователя фронтендом
  socket.on('get_rooms', async ({ username }) => {
    const list = await getUserRooms(username)
    socket.emit('rooms_list', list)
  })

  socket.on('create_room', async ({ username, roomName }) => {
    try {
      const code = generateCode()
      const id = code.toLowerCase()
      const name = roomName ? `# ${roomName.toUpperCase().slice(0,16)}` : `# ROOM-${code}`
      
      // 1. Создаем комнату
      await pool.query(
        'INSERT INTO rooms (id, name, code, created_by) VALUES ($1,$2,$3,$4)',
        [id, name, code, username]
      )
      // 2. Сразу делаем создателя участником
      await pool.query(
        'INSERT INTO room_members (room_id, username) VALUES ($1, $2)',
        [id, username]
      )
      
      const list = await getUserRooms(username)
      socket.emit('rooms_list', list)
      socket.emit('room_created', { id, code, name })
    } catch (err) {
      console.error(err)
    }
  })

  socket.on('join_by_code', async ({ code, username }) => {
    try {
      const result = await pool.query(
        'SELECT * FROM rooms WHERE UPPER(code) = UPPER($1)', [code]
      )
      if (result.rows.length === 0) {
        socket.emit('join_error', 'Room not found')
        return
      }
      
      const room = result.rows[0]
      
      // Добавляем юзера в участники комнаты, если его там еще нет
      await pool.query(`
        INSERT INTO room_members (room_id, username) 
        VALUES ($1, $2) 
        ON CONFLICT (room_id, username) DO NOTHING
      `, [room.id, username])

      const list = await getUserRooms(username)
      socket.emit('rooms_list', list)
      socket.emit('join_by_code_success', { roomId: room.id })
    } catch (err) {
      console.error(err)
      socket.emit('join_error', 'Server error')
    }
  })

  socket.on('join_room', async ({ roomId, username }) => {
    socket.rooms.forEach(room => { if (room !== socket.id) socket.leave(room) })
    socket.join(roomId)
    socket.data.currentRoom = roomId
    socket.data.username = username
    const history = await getRoomHistory(roomId)
    socket.emit('room_history', history)
    socket.to(roomId).emit('user_joined', { username, roomId })
  })

  socket.on('send_message', async (data) => {
    const { roomId, username, content, type, audioData, avatar } = data

    if (!socket.data.msgCount) socket.data.msgCount = 0
    if (!socket.data.msgReset) socket.data.msgReset = Date.now()
    if (Date.now() - socket.data.msgReset > 60000) {
      socket.data.msgCount = 0
      socket.data.msgReset = Date.now()
    }
    socket.data.msgCount++
    if (socket.data.msgCount > 30) {
      socket.emit('rate_limited', 'Too many messages, wait a minute')
      return
    }

    const message = {
      id: Date.now(), username, content: content || '',
      type: type || 'text', audioData: audioData || null,
      avatar: avatar || null, roomId,
      time: new Date().toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' }),
      rotate: (Math.random() * 4 - 2).toFixed(2),
      system: false, isEdited: false, isPinned: false
    }

    await pool.query(`
      INSERT INTO messages (id, room_id, username, content, type, audio_data, time, rotate, system)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      message.id, message.roomId, message.username, message.content,
      message.type, message.audioData, message.time, message.rotate, message.system
    ])

    io.to(roomId).emit('receive_message', message)
  })

  // ── Обработчики контекстного меню ────────────────
  
  // 1. Удаление сообщения
  socket.on('delete_message', async ({ messageId, roomId }) => {
    try {
      await pool.query('DELETE FROM messages WHERE id = $1', [messageId])
      io.to(roomId).emit('message_deleted', { messageId })
    } catch (err) {
      console.error(err)
    }
  })

  // 2. Редактирование сообщения
  socket.on('edit_message', async ({ messageId, roomId, newContent }) => {
    try {
      await pool.query('UPDATE messages SET content = $1, is_edited = TRUE WHERE id = $2', [newContent, messageId])
      io.to(roomId).emit('message_edited', { messageId, newContent })
    } catch (err) {
      console.error(err)
    }
  })

  // 3. Закрепление/Открепление сообщения
  socket.on('pin_message', async ({ messageId, roomId, pinStatus }) => {
    try {
      await pool.query('UPDATE messages SET is_pinned = $1 WHERE id = $2', [pinStatus, messageId])
      io.to(roomId).emit('message_pinned', { messageId, pinStatus })
    } catch (err) {
      console.error(err)
    }
  })

  socket.on('typing_start', ({ roomId, username }) => {
    if (!typingUsers[roomId]) typingUsers[roomId] = {}
    typingUsers[roomId][socket.id] = username
    socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
  })

  socket.on('typing_stop', ({ roomId }) => {
    if (typingUsers[roomId]) {
      delete typingUsers[roomId][socket.id]
      socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
    }
  })

 socket.on('disconnect', async () => {
    // 1. Очистка статуса "печатает..." (твой рабочий код)
    const roomId = socket.data.currentRoom
    if (roomId && typingUsers[roomId]) {
      delete typingUsers[roomId][socket.id]
      socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
    }

    // 2. Спасаем комнаты OAuth-пользователей и чистим гостей
    const activeUsername = socket.data.username

    if (activeUsername) {
      try {
        // Проверяем, существует ли этот ник в таблице зарегистрированных юзеров
        const userCheck = await pool.query(
          'SELECT 1 FROM chat_users WHERE username = $1 LIMIT 1',
          [activeUsername]
        )

        // Если в chat_users такого имени НЕТ — значит это временный гость по нику
        if (userCheck.rows.length === 0) {
          await pool.query(
            'DELETE FROM room_members WHERE username = $1',
            [activeUsername]
          )
          console.log(`[🧹 PURGE] Временный гость ${activeUsername} стерт из всех комнат.`)
        } else {
          // Юзер есть в базе, он заходил через Google/GitHub. Оставляем его комнаты в покое.
          console.log(`[💾 KEEP] Пользователь ${activeUsername} (OAuth) отключился. Комнаты сохранены в БД.`)
        }
      } catch (err) {
        console.error('[Disconnect Error]:', err)
      }
    }

    console.log('отключился:', socket.id)
  })
})

initDB().then(() => {
  const PORT = process.env.PORT || 3001
  httpServer.listen(PORT, () => console.log(`server: http://localhost:${PORT}`))
})