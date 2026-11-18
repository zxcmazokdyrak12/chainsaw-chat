import jwt from 'jsonwebtoken'
import type { Request } from 'express'
import { JWT_SECRET } from '../config.js'
import type { JwtPayload } from '../types.js'

type TokenUser = { id: number; username: string; avatar: string | null; email?: string | null }

export function signToken(user: TokenUser, expiresIn: '7d' | '30d' = '30d'): string {
  const payload: JwtPayload = { id: user.id, username: user.username, avatar: user.avatar }
  if (user.email !== undefined) payload.email = user.email
  return jwt.sign(payload, JWT_SECRET, { expiresIn, algorithm: 'HS256' })
}

// guests get a short-lived signed name — the server never trusts a username sent by the client
export function signGuestToken(username: string, avatar: string | null, guestId: string): string {
  const payload: JwtPayload = { id: 0, username, avatar, guest: true, gid: guestId }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' })
}

export function verifyToken(token: string | undefined | null): JwtPayload | null {
  if (!token || typeof token !== 'string' || token.length > 2048) return null
  try {
    const p = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload
    return p && typeof p.username === 'string' ? p : null
  } catch {
    return null
  }
}

// reads "Authorization: Bearer <token>"; null when missing or invalid
export function readToken(req: Request): JwtPayload | null {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ')
  if (scheme !== 'Bearer') return null
  return verifyToken(token)
}
