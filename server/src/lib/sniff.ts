// Trust the bytes, not the Content-Type header: an "image" that is really HTML/SVG would be an XSS
// when served back. Only these formats are accepted, recognised by their magic numbers.
export const IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/gif'] as const
export const AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'] as const

const starts = (b: Buffer, bytes: number[], at = 0) => bytes.every((v, i) => b[at + i] === v)

export function sniff(b: Buffer): string | null {
  if (b.length < 12) return null
  if (starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp'
  if (starts(b, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (starts(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (starts(b, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  if (starts(b, [0x1a, 0x45, 0xdf, 0xa3])) return 'audio/webm'           // EBML (webm/matroska)
  if (starts(b, [0x4f, 0x67, 0x67, 0x53])) return 'audio/ogg'
  if (starts(b, [0x66, 0x74, 0x79, 0x70], 4)) return 'audio/mp4'          // ....ftyp (Safari records m4a)
  if (starts(b, [0x49, 0x44, 0x33]) || (b[0] === 0xff && (b[1]! & 0xe0) === 0xe0)) return 'audio/mpeg'
  return null
}
