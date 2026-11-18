import { API_URL } from '../config'
import { authHeader } from './auth'

export const mediaUrl = (id: string) => `${API_URL}/media/${id}`

// upload raw bytes into a room; resolves to the attachment id
export async function uploadMedia(blob: Blob, roomId: string): Promise<string> {
  const r = await fetch(`${API_URL}/media?roomId=${encodeURIComponent(roomId)}`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'application/octet-stream', ...authHeader() },
    body: blob,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok || !data.id) throw new Error(data.error || (r.status === 413 ? 'File is too big' : 'Upload failed'))
  return data.id as string
}

const MAX_SIDE = 1600
const MAX_GIF = 2_000_000

// shrink a picture before upload: ≤1600px on the long side, webp (jpeg where webp encoding isn't supported).
// GIFs are sent as they are (re-encoding would kill the animation) if they're small enough.
export async function preparePicture(file: File | Blob): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('That is not a picture')
  if (file.type === 'image/gif') {
    if (file.size > MAX_GIF) throw new Error('GIF is too big (2 MB max)')
    return file
  }
  const bmp = await createImageBitmap(file).catch(() => null)
  if (!bmp) throw new Error("Can't read that picture")
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Can't read that picture")
  ctx.fillStyle = '#fff' // transparent PNGs → paper, not black
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  const toBlob = (type: string, q: number) => new Promise<Blob | null>(res => canvas.toBlob(res, type, q))
  const webp = await toBlob('image/webp', 0.82)
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await toBlob('image/jpeg', 0.85)
  if (!jpeg) throw new Error("Can't read that picture")
  return jpeg
}
