// shapes shared by the chat screen and its hooks

export interface MessageItem {
  id: string | number
  username?: string
  content: string
  avatar?: string
  system?: boolean
  time?: string
  type?: 'text' | 'audio' | string
  audioData?: string | ArrayBuffer | null
  reactions?: Record<string, string[]>
  media?: string | null
  replyTo?: { id: number; username: string | null; content: string; type: string } | null
}

export interface RoomItem {
  id: string
  name: string
  count: number | string
  code: string
}

export interface AvatarItem {
  id: string
  name: string
  src: string
}

export interface ContextMenuState {
  x: number
  y: number
  msg: any
}

export interface GroupedItem {
  type: 'divider' | 'message' | string
  label?: string
  data?: any
}
