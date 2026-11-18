import { io, type Socket } from 'socket.io-client'
import { API_URL } from '../config'

export const socket: Socket = io(API_URL, {
  transports: ['websocket', 'polling'],
})
