import dotenv from 'dotenv'
import path from 'path'
import crypto from 'crypto'

// load server/.env before anything reads process.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.RENDER

// JWT secret: never fall back to a value that is public in the repo — anyone could forge tokens with it.
// No secret in production → a random one per boot (everyone is logged out on restart, but nobody can forge).
function jwtSecret(): string {
  const s = process.env.JWT_SECRET
  if (s && s.length >= 32) return s
  if (s) console.warn('[security] JWT_SECRET is shorter than 32 chars — use `openssl rand -hex 32`')
  if (s) return s
  if (IS_PROD) {
    console.error('[security] JWT_SECRET is not set! Using a random secret: tokens die on every restart. Set it in Render → Environment.')
    return crypto.randomBytes(32).toString('hex')
  }
  return 'dev-only-secret-not-for-production-use-0000'
}

export const JWT_SECRET = jwtSecret()
export const SESSION_SECRET = process.env.SESSION_SECRET || JWT_SECRET
export const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'
// the Android app (Capacitor) talks to the API from https://localhost (iOS: capacitor://localhost);
// override with APP_ORIGINS="https://localhost,capacitor://localhost" or set it empty to turn this off
export const APP_ORIGINS = (process.env.APP_ORIGINS ?? 'https://localhost,capacitor://localhost')
  .split(',').map(s => s.trim()).filter(Boolean)
export const ALLOWED_ORIGINS = [CLIENT_URL, ...APP_ORIGINS]
export const SERVER_URL = process.env.SERVER_URL ?? 'https://chainsaw-chat.onrender.com'
export const PORT = process.env.PORT ?? 3001

// the lobby everybody lands in; every other room needs a membership (join by code)
export const PUBLIC_ROOM = 'general'

// open /version after a deploy to make sure Render runs the fresh build
export const BUILD = 'manga-v7'
