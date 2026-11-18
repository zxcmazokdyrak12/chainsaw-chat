import { io, type Socket } from 'socket.io-client'
import { API_URL } from '../config'
import { getToken } from './auth'

// The server only accepts sockets with a signed token (account or guest) — it never trusts
// a username sent in an event. `auth` is a callback so every reconnect sends the current token.
export const socket: Socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() }),
})

// call after logging in (or switching account): opens the socket with the fresh token
export function connectSocket() {
  if (socket.connected) socket.disconnect()
  socket.connect()
}
