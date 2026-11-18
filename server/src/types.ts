// shared shapes used by routes and socket handlers

export interface AuthUser {
  id: number
  username: string
  avatar: string | null
  email?: string | null
}

export interface JwtPayload {
  id: number
  username: string
  avatar: string | null
  email?: string | null
  guest?: boolean
  gid?: string
}

export interface SocketData {
  currentRoom?: string
  username?: string   // from the verified token — never from the event payload
  guest?: boolean
  callRoom?: string
}

export type Reactions = Record<string, string[]>

// allowed reaction set — keeps the payload small and on-theme
// reaction ids (the client draws them as manga stickers)
export const REACTIONS = ['like', 'fuck', 'sad', 'neutral', 'sly', 'angry', 'joy'] as const
