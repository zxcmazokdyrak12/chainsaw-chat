import { useEffect, useRef } from 'react'
import { socket } from '../lib/socket'

// socket.io reconnects by itself (Render naps, phone goes to background), but the new socket
// is not in any room — rejoin, otherwise reactions / calls / messages silently go nowhere
export function useRejoinOnReconnect(session: { phase: string; username: string; currentRoom: string; avatarSrc: string }) {
  const sessionRef = useRef(session)
  sessionRef.current = session

  useEffect(() => {
    let firstConnect = true
    const onConnect = () => {
      if (firstConnect) { firstConnect = false; return }
      const s = sessionRef.current
      if (s.phase !== 'chat' || !s.username) return
      socket.emit('get_rooms', { username: s.username })
      socket.emit('join_room', { roomId: s.currentRoom, username: s.username, avatar: s.avatarSrc })
    }
    const onReactError = (msg: string) => console.warn('[reaction]', msg)
    if (socket.connected) firstConnect = false
    socket.on('connect', onConnect)
    socket.on('react_error', onReactError)
    return () => { socket.off('connect', onConnect); socket.off('react_error', onReactError) }
  }, [])
}
