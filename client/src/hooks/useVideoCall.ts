import { useEffect, useRef, useState, useCallback } from 'react'
import type { Socket } from 'socket.io-client'
import { ICE_SERVERS } from '../config'

// Mesh WebRTC: every participant holds a direct RTCPeerConnection to every other one.
// The server only relays signaling (offer / answer / ICE) — media never touches it.

export interface RemotePeer {
  socketId: string
  username: string
  stream: MediaStream | null
}

export interface VideoCallApi {
  inCall: boolean
  joining: boolean
  participants: string[]
  localStream: MediaStream | null
  remotes: RemotePeer[]
  micOn: boolean
  camOn: boolean
  error: string
  join: () => void
  leave: () => void
  toggleMic: () => void
  toggleCam: () => void
  clearError: () => void
}

interface SignalMsg<T> {
  from: string
  username?: string
  payload: T
}

export function useVideoCall(socket: Socket, roomId: string): VideoCallApi {
  const [inCall, setInCall]             = useState<boolean>(false)
  const [joining, setJoining]           = useState<boolean>(false)
  const [participants, setParticipants] = useState<string[]>([])
  const [localStream, setLocalStream]   = useState<MediaStream | null>(null)
  const [remotes, setRemotes]           = useState<RemotePeer[]>([])
  const [micOn, setMicOn]               = useState<boolean>(true)
  const [camOn, setCamOn]               = useState<boolean>(true)
  const [error, setError]               = useState<string>('')

  const pcs      = useRef<Map<string, RTCPeerConnection>>(new Map())
  const localRef = useRef<MediaStream | null>(null)
  const roomRef  = useRef<string>(roomId)
  const inCallRef = useRef<boolean>(false)

  const upsertRemote = (socketId: string, username: string, stream: MediaStream | null) => {
    setRemotes(prev => {
      const found = prev.find(p => p.socketId === socketId)
      if (found) return prev.map(p => (p.socketId === socketId ? { ...p, username, stream: stream ?? p.stream } : p))
      return [...prev, { socketId, username, stream }]
    })
  }

  const removePeer = (socketId: string) => {
    pcs.current.get(socketId)?.close()
    pcs.current.delete(socketId)
    setRemotes(prev => prev.filter(p => p.socketId !== socketId))
  }

  const createPeer = (socketId: string, username: string, initiator: boolean): RTCPeerConnection => {
    pcs.current.get(socketId)?.close()
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcs.current.set(socketId, pc)
    upsertRemote(socketId, username, null)

    const local = localRef.current
    local?.getTracks().forEach(track => pc.addTrack(track, local))

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('webrtc_ice', { to: socketId, payload: e.candidate.toJSON() })
    }
    pc.ontrack = (e) => {
      upsertRemote(socketId, username, e.streams[0] ?? new MediaStream([e.track]))
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') removePeer(socketId)
    }

    if (initiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => socket.emit('webrtc_offer', { to: socketId, payload: pc.localDescription }))
        .catch(err => console.error('[WebRTC offer]', err))
    }
    return pc
  }

  const teardown = () => {
    pcs.current.forEach(pc => pc.close())
    pcs.current.clear()
    localRef.current?.getTracks().forEach(t => t.stop())
    localRef.current = null
    inCallRef.current = false
    setLocalStream(null)
    setRemotes([])
    setInCall(false)
    setJoining(false)
    setMicOn(true)
    setCamOn(true)
  }

  const leave = useCallback(() => {
    if (inCallRef.current) socket.emit('call_leave')
    teardown()
  }, [socket])

  const join = useCallback(async () => {
    if (inCallRef.current || joining) return
    setError('')
    setJoining(true)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
    } catch {
      // no camera (or it's busy) → still join with voice only
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setCamOn(false)
      } catch {
        setJoining(false)
        setError('Camera / mic access denied')
        return
      }
    }
    localRef.current = stream
    inCallRef.current = true
    setLocalStream(stream)
    setInCall(true)
    setJoining(false)
    socket.emit('call_join', { roomId: roomRef.current })
  }, [socket, joining])

  const toggleMic = () => {
    const tracks = localRef.current?.getAudioTracks() ?? []
    const next = !micOn
    tracks.forEach(t => { t.enabled = next })
    setMicOn(next)
  }

  const toggleCam = () => {
    const tracks = localRef.current?.getVideoTracks() ?? []
    if (!tracks.length) return
    const next = !camOn
    tracks.forEach(t => { t.enabled = next })
    setCamOn(next)
  }

  // signaling listeners — registered once, they only touch refs and setters
  useEffect(() => {
    const onState = ({ roomId: r, participants: list }: { roomId: string; participants: string[] }) => {
      if (r === roomRef.current) setParticipants(list)
    }
    // we just joined: call everyone who is already there
    const onPeers = ({ peers }: { roomId: string; peers: { socketId: string; username: string }[] }) => {
      peers.forEach(p => createPeer(p.socketId, p.username, true))
    }
    const onOffer = async ({ from, username, payload }: SignalMsg<RTCSessionDescriptionInit>) => {
      if (!inCallRef.current) return
      const pc = createPeer(from, username ?? '???', false)
      try {
        await pc.setRemoteDescription(payload)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('webrtc_answer', { to: from, payload: pc.localDescription })
      } catch (err) { console.error('[WebRTC answer]', err) }
    }
    const onAnswer = ({ from, payload }: SignalMsg<RTCSessionDescriptionInit>) => {
      pcs.current.get(from)?.setRemoteDescription(payload).catch(err => console.error('[WebRTC remote]', err))
    }
    const onIce = ({ from, payload }: SignalMsg<RTCIceCandidateInit>) => {
      pcs.current.get(from)?.addIceCandidate(payload).catch(() => {})
    }
    const onPeerLeft = ({ socketId }: { socketId: string }) => removePeer(socketId)
    const onCallError = (msg: string) => { setError(msg); teardown() }

    socket.on('call_state', onState)
    socket.on('call_peers', onPeers)
    socket.on('webrtc_offer', onOffer)
    socket.on('webrtc_answer', onAnswer)
    socket.on('webrtc_ice', onIce)
    socket.on('call_peer_left', onPeerLeft)
    socket.on('call_error', onCallError)
    return () => {
      socket.off('call_state', onState)
      socket.off('call_peers', onPeers)
      socket.off('webrtc_offer', onOffer)
      socket.off('webrtc_answer', onAnswer)
      socket.off('webrtc_ice', onIce)
      socket.off('call_peer_left', onPeerLeft)
      socket.off('call_error', onCallError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket])

  // switching rooms drops you out of the call
  useEffect(() => {
    if (roomRef.current !== roomId && inCallRef.current) leave()
    roomRef.current = roomId
    setParticipants([])
  }, [roomId, leave])

  // closing the tab / unmount
  useEffect(() => () => {
    if (inCallRef.current) socket.emit('call_leave')
    teardown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    inCall, joining, participants, localStream, remotes, micOn, camOn, error,
    join, leave, toggleMic, toggleCam, clearError: () => setError(''),
  }
}
