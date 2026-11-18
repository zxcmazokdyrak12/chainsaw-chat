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
}

export interface SocketData {
  currentRoom?: string
  username?: string
  msgCount?: number
  msgReset?: number
  callRoom?: string
}

export type Reactions = Record<string, string[]>

// allowed reaction set — keeps the payload small and on-theme
// reaction ids (the client draws them as manga stickers)
export const REACTIONS = ['like', 'fuck', 'sad', 'neutral', 'sly', 'angry', 'joy'] as const

export interface SendMessagePayload {
  roomId: string
  username: string
  content?: string
  type?: string
  audioData?: string
  avatar?: string
}
