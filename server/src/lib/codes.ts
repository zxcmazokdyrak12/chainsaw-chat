import crypto from 'crypto'

const SYLLABLES = [
  'KAI','ZEN','RYU','KEN','MAI','SHI','DEN','AKI',
  'REZ','POW','CUT','SAW','DEV','HUN','CHI','BLO',
]

// 2 syllables + 4 digits ≈ 2.5 million codes; with the per-socket try limit that's not guessable
export const generateCode = (): string => {
  const a = SYLLABLES[crypto.randomInt(SYLLABLES.length)]
  const b = SYLLABLES[crypto.randomInt(SYLLABLES.length)]
  const n = crypto.randomInt(10_000).toString().padStart(4, '0')
  return `${a}${b}${n}`
}
