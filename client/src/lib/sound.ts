export const CHAINSAW_SFX = '/chainsaw.mp3'

export function playSound(src: string, volume = 0.4): void {
  const audio = new Audio(src)
  audio.volume = volume
  audio.play().catch(() => {})
}

// CAPS with 3+ letters = shouting (used for the shout balloon, SFX and the chainsaw roar)
export function isShout(text: string): boolean {
  return text === text.toUpperCase() && text.replace(/[^a-zA-Zа-яА-Я]/g, '').length > 2
}
