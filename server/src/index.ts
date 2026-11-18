import { CLIENT_URL, JWT_SECRET, PORT } from './config.js'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import passport from 'passport'
import session from 'express-session'
import { configurePassport } from './passport.js'
import { registerMetaRoutes } from './routes/meta.js'
import { registerAuthRoutes } from './routes/auth.js'
import { registerProfileRoutes } from './routes/profile.js'
import { registerSockets } from './sockets/index.js'

// Entry point: wires middleware, routes and socket handlers together.
// The actual logic lives in routes/, sockets/ and lib/.

const app = express()

// Render sits behind a proxy — needed for express-rate-limit to see real IPs
app.set('trust proxy', 1)

app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(helmet())
app.use(rateLimit({ windowMs: 60_000, max: 100 }))
app.use(express.json())
app.use(session({ secret: JWT_SECRET, resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())
configurePassport()

registerMetaRoutes(app)
registerAuthRoutes(app)
registerProfileRoutes(app)

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'], credentials: true },
  maxHttpBufferSize: 5e6,
})
registerSockets(io)

httpServer.listen(PORT, () => console.log(`🔥 server: http://localhost:${PORT}`))
