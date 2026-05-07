import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

// Basic rooms + dynamically generated
const rooms = {
  'general': { name: '# GENERAL', history: [], createdBy: 'system', code: 'GENERAL1' },
  'devils':  { name: '# DEVILS',  history: [], createdBy: 'system', code: 'DEVILS00' },
  'hunters': { name: '# HUNTERS', history: [], createdBy: 'system', code: 'HUNTERS0' },
  'pochita': { name: '# POCHITA', history: [], createdBy: 'system', code: 'POCHITA0' },
}

const typingUsers = {}

// Room Code Generator - Random Syllables, Readable, 8 Characters
const SYLLABLES = ['KAI','ZEN','RYU','KEN','MAI','SHI','DEN','AKI','REZ','POW','CUT','SAW','DEV','HUN','CHI','BLO']

const generateCode = () => {
  const a = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
  const b = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
  // We add a number to guarantee uniqueness.
  const n = Math.floor(Math.random() * 99).toString().padStart(2, '0')
  return `${a}${b}${n}` // example: KAIRYU42
}

const getRoomsList = () =>
  Object.entries(rooms).map(([id, r]) => ({
    id,
    name: r.name,
    code: r.code,
    count: r.history.length,
    createdBy: r.createdBy,
  }))

io.on('connection', (socket) => {
  console.log('connected:', socket.id)

  socket.emit('rooms_list', getRoomsList())

  // Create a new room
  socket.on('create_room', ({ username, roomName }) => {
    const code = generateCode()
    const id   = code.toLowerCase()
    const name = roomName
      ? `# ${roomName.toUpperCase().slice(0, 16)}`
      : `# ROOM-${code}`

    rooms[id] = {
      name,
      history: [],
      createdBy: username,
      code,
    }

    // We are sending out the updated list to everyone.
    io.emit('rooms_list', getRoomsList())
    // We tell the creator the code for his room
    socket.emit('room_created', { id, code, name })

    console.log(`${username} created the room ${name} (${code})`)
  })

  // join with code
  socket.on('join_by_code', ({ code, username }) => {
    const entry = Object.entries(rooms).find(
      ([, r]) => r.code.toUpperCase() === code.toUpperCase()
    )
    if (!entry) {
      socket.emit('join_error', 'room not found')
      return
    }
    const [roomId] = entry
    socket.emit('join_by_code_success', { roomId })
  })

  // join the room
  socket.on('join_room', ({ roomId, username }) => {
    Object.keys(rooms).forEach(id => socket.leave(id))
    socket.join(roomId)
    socket.data.currentRoom = roomId
    socket.data.username = username

    socket.emit('room_history', rooms[roomId]?.history || [])
    socket.to(roomId).emit('user_joined', { username, roomId })
  })

  // message
  socket.on('send_message', (data) => {
    const { roomId, username, content, type, audioData } = data
    if (!rooms[roomId]) return

    const message = {
      id: Date.now(),
      username,
      content: content || '',
      type: type || 'text',      // 'text' | 'audio'
      audioData: audioData || null,
      roomId,
      time: new Date().toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' }),
      rotate: (Math.random() * 4 - 2).toFixed(2),
    }

    rooms[roomId].history.push(message)
    if (rooms[roomId].history.length > 100) rooms[roomId].history.shift()

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
    console.log('disconected:', socket.id)
  })
})


const PORT = process.env.PORT || 3001; 

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`The server is running on port: ${PORT}`);
});
