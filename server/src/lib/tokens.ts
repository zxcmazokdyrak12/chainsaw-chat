import jwt from 'jsonwebtoken'
import type { Request } from 'express'
import { JWT_SECRET } from '../config.js'
import type { JwtPayload } from '../types.js'

type TokenUser = { id: number; username: string; avatar: string | null; email?: string | null }

export function signToken(user: TokenUser, expiresIn: '7d' | '30d' = '30d'): string {
  const payload: JwtPayload = { id: user.id, username: user.username, avatar: user.avatar }
  if (user.email !== undefined) payload.email = user.email
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

// reads "Authorization: Bearer <token>"; null when missing or invalid
export function readToken(req: Request): JwtPayload | null {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}
