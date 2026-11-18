import { useRef, useState } from 'react'

const CUTE_WORDS = ['honey','baby','darling','sweetie','angel','sunshine','bunny','kitty', 'cute', 'love', 'sweet', 'aww', '❤️', '🥺', '💕', '😍', '🐾']

export interface Heart { id: number; x: number; delay: number; size: number; rotate: number }

// Pochita easter egg: hearts rain on cute words (40% chance)
export function usePochita(enabled: boolean) {
  const [pochitaVisible, setPochitaVisible] = useState<boolean>(false)
  const [hearts, setHearts] = useState<Heart[]>([])
  const on = useRef<boolean>(enabled)
  on.current = enabled

  const triggerPochita = (text: string, force = false): void => {
    if (!on.current) return
    const lower = (text || '').toLowerCase()
    const isCute = CUTE_WORDS.some(w => lower.includes(w))
    if (!force && (!isCute || Math.random() > 0.4)) return
    const newHearts = Array.from({ length: 9 }, (_, i) => ({
      id: i, x: 10 + Math.random() * 75,
      delay: Math.random() * 0.5, size: 40 + Math.random() * 40,
      rotate: -40 + Math.random() * 80,
    }))
    setPochitaVisible(true)
    setHearts(newHearts)
    setTimeout(() => { setPochitaVisible(false); setHearts([]) }, 2500)
  }
  return { pochitaVisible, hearts, triggerPochita }
}
