import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Создаём таблицы если их нет
// Это выполняется один раз при старте сервера
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGINT PRIMARY KEY,
      room_id TEXT REFERENCES rooms(id),
      username TEXT,
      content TEXT,
      type TEXT DEFAULT 'text',
      audio_data TEXT,
      time TEXT,
      rotate TEXT,
      system BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  // Создаём базовые комнаты если их ещё нет
  const baseRooms = [
    { id: 'general', name: '# GENERAL', code: 'GENERAL1', created_by: 'system' },
    { id: 'devils',  name: '# DEVILS',  code: 'DEVILS00', created_by: 'system' },
    { id: 'hunters', name: '# HUNTERS', code: 'HUNTERS0', created_by: 'system' },
    { id: 'pochita', name: '# POCHITA', code: 'POCHITA0', created_by: 'system' },
  ]

  for (const room of baseRooms) {
    await pool.query(`
      INSERT INTO rooms (id, name, code, created_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [room.id, room.name, room.code, room.created_by])
  }

  console.log('БД готова')
}

const app = express()
app.use(cors())

app.get('/ping', (req, res) => res.send('ok'))

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

const typingUsers = {}

const SYLLABLES = ['KAI','ZEN','RYU','KEN','MAI','SHI','DEN','AKI','REZ','POW','CUT','SAW','DEV','HUN','CHI','BLO']

const generateCode = () => {
  const a = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
  const b = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
  const n = Math.floor(Math.random() * 99).toString().padStart(2, '0')
  return `${a}${b}${n}`
}

// Получить список комнат с количеством сообщений
async function getRoomsList() {
  const result = await pool.query(`
    SELECT r.id, r.name, r.code, r.created_by,
           COUNT(m.id) as count
    FROM rooms r
    LEFT JOIN messages m ON m.room_id = r.id
    GROUP BY r.id, r.name, r.code, r.created_by
    ORDER BY r.created_at ASC
  `)
  return result.rows.map(r => ({
    id: r.id,
    name: r.name,
    code: r.code,
    createdBy: r.created_by,
    count: parseInt(r.count)
  }))
}

// Получить последние 100 сообщений комнаты
async function getRoomHistory(roomId) {
  const result = await pool.query(`
    SELECT * FROM messages
    WHERE room_id = $1
    ORDER BY created_at ASC
    LIMIT 100
  `, [roomId])

  return result.rows.map(r => ({
    id: r.id,
    username: r.username,
    content: r.content,
    type: r.type,
    audioData: r.audio_data,
    time: r.time,
    rotate: r.rotate,
    system: r.system,
    roomId: r.room_id,
  }))
}

io.on('connection', async (socket) => {
  console.log('подключился:', socket.id)

  // Отдаём список комнат
  const roomsList = await getRoomsList()
  socket.emit('rooms_list', roomsList)

  // Создать комнату
  socket.on('create_room', async ({ username, roomName }) => {
    const code = generateCode()
    const id   = code.toLowerCase()
    const name = roomName
      ? `# ${roomName.toUpperCase().slice(0, 16)}`
      : `# ROOM-${code}`

    await pool.query(`
      INSERT INTO rooms (id, name, code, created_by)
      VALUES ($1, $2, $3, $4)
    `, [id, name, code, username])

    const roomsList = await getRoomsList()
    io.emit('rooms_list', roomsList)
    socket.emit('room_created', { id, code, name })
  })

  // Войти по коду
  socket.on('join_by_code', async ({ code, username }) => {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE UPPER(code) = UPPER($1)',
      [code]
    )
    if (result.rows.length === 0) {
      socket.emit('join_error', 'Room not found')
      return
    }
    socket.emit('join_by_code_success', { roomId: result.rows[0].id })
  })

  // Войти в комнату
  socket.on('join_room', async ({ roomId, username }) => {
    Object.keys(typingUsers).forEach(room => {
      if (typingUsers[room]) delete typingUsers[room][socket.id]
    })
    socket.rooms.forEach(room => {
      if (room !== socket.id) socket.leave(room)
    })

    socket.join(roomId)
    socket.data.currentRoom = roomId
    socket.data.username = username

    // Отдаём историю из БД
    const history = await getRoomHistory(roomId)
    socket.emit('room_history', history)

    socket.to(roomId).emit('user_joined', { username, roomId })
  })

  // Отправить сообщение
  socket.on('send_message', async (data) => {
    const { roomId, username, content, type, audioData } = data

    const message = {
      id: Date.now(),
      username,
      content: content || '',
      type: type || 'text',
      audioData: audioData || null,
      roomId,
      time: new Date().toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' }),
      rotate: (Math.random() * 4 - 2).toFixed(2),
      system: false,
    }

    // Сохраняем в БД
    await pool.query(`
      INSERT INTO messages (id, room_id, username, content, type, audio_data, time, rotate, system)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      message.id, message.roomId, message.username,
      message.content, message.type, message.audioData,
      message.time, message.rotate, message.system
    ])

    io.to(roomId).emit('receive_message', message)
  })

  // Typing
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

  socket.on('disconnect', () => {
    const roomId = socket.data.currentRoom
    if (roomId && typingUsers[roomId]) {
      delete typingUsers[roomId][socket.id]
      socket.to(roomId).emit('typing_update', Object.values(typingUsers[roomId]))
    }
    console.log('отключился:', socket.id)
  })
})

// Запускаем сервер только после инициализации БД
initDB().then(() => {
  const PORT = process.env.PORT || 3001
  httpServer.listen(PORT, () => console.log(`Сервер: http://localhost:${PORT}`))
})