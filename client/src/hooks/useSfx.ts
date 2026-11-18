import { useRef, useState } from 'react'
import { makeBurst, type SfxBurst } from '../components/SfxLayer'

// manga SFX bursts over the feed; the ref keeps socket handlers from reading a stale setting
export function useSfx(enabled: boolean) {
  const [sfx, setSfx] = useState<SfxBurst[]>([])
  const on = useRef<boolean>(enabled)
  on.current = enabled

  const popSfx = (kind: 'shout' | 'send' | 'join', own: boolean): void => {
    if (!on.current) return
    const b = makeBurst(kind, own)
    setSfx(p => [...p.slice(-3), b])
    setTimeout(() => setSfx(p => p.filter(x => x.id !== b.id)), kind === 'shout' ? 1100 : 750)
  }
  return { sfx, popSfx }
}
