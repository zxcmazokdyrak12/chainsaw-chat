import { CLIENT_URL, IS_PROD, PORT, SESSION_SECRET } from './config.js'
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
import { registerIceRoutes } from './routes/ice.js'
import { registerMediaRoutes } from './routes/media.js'
import { registerSockets } from './sockets/index.js'

// Entry point: wires middleware, routes and socket handlers together.
// The actual logic lives in routes/, sockets/ and lib/.

const app = express()

// Render sits behind a proxy — needed for express-rate-limit (real IPs) and secure cookies
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(helmet())
app.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }))
app.use(express.json({ limit: '20kb' }))
// the session only carries the OAuth `state` during the provider round-trip
app.use(session({
  name: 'csm.sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: IS_PROD, maxAge: 10 * 60_000 },
}))
app.use(passport.initialize())
app.use(passport.session())
configurePassport()

registerMetaRoutes(app)
registerAuthRoutes(app)
registerProfileRoutes(app)
registerIceRoutes(app)
registerMediaRoutes(app)

// no stack traces to the outside world
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[HTTP Error]:', err.message)
  res.status((err as any).status ?? 500).json({ error: (err as any).expose ? err.message : 'Server error' })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'], credentials: true },
  maxHttpBufferSize: 5e6, // voice messages
})
registerSockets(io)

httpServer.listen(PORT, () => console.log(`🔥 server: http://localhost:${PORT}`))
