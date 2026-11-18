import crypto from 'crypto'
import { prisma } from './prisma.js'
import { sigV4, sha256 } from './sigv4.js'

// Where uploaded bytes go.
//  • default: Postgres (`attachments.data`) — zero setup, fine for a demo
//  • Cloudflare R2 when R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET are set
//    (S3 API, signed by hand with SigV4 below — no AWS SDK needed)

const R2 = {
  account: process.env.R2_ACCOUNT_ID,
  key: process.env.R2_ACCESS_KEY_ID,
  secret: process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET,
}
export const r2Enabled = () => !!(R2.account && R2.key && R2.secret && R2.bucket)

async function r2(method: 'PUT' | 'GET' | 'DELETE', key: string, body?: Buffer, mime?: string): Promise<Response> {
  const host = `${R2.account}.r2.cloudflarestorage.com`
  const path = `/${R2.bucket}/${key}`
  const amzDate = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const headers = sigV4({
    method, host, path, region: 'auto', service: 's3',
    accessKey: R2.key!, secretKey: R2.secret!, amzDate,
    payloadHash: body ? sha256(body) : sha256(''),
    headers: mime ? { 'content-type': mime } : undefined,
  })
  delete (headers as Record<string, string>).host
  return fetch(`https://${host}${path}`, { method, headers, body: body ? new Uint8Array(body) : undefined })
}

export async function saveMedia(a: { roomId: string; username: string; mime: string; data: Buffer }): Promise<string> {
  const id = crypto.randomUUID() // 122 random bits: the id itself is the capability to read the file
  if (r2Enabled()) {
    const r = await r2('PUT', id, a.data, a.mime)
    if (!r.ok) throw new Error(`R2 upload failed: ${r.status}`)
    await prisma.attachment.create({ data: { id, roomId: a.roomId, username: a.username, mime: a.mime, size: a.data.length, storage: 'r2' } })
  } else {
    await prisma.attachment.create({ data: { id, roomId: a.roomId, username: a.username, mime: a.mime, size: a.data.length, data: a.data } })
  }
  return id
}

export async function loadMedia(id: string): Promise<{ mime: string; data: Buffer } | null> {
  const row = await prisma.attachment.findUnique({ where: { id } })
  if (!row) return null
  if (row.storage === 'r2') {
    const r = await r2('GET', id)
    if (!r.ok) return null
    return { mime: row.mime, data: Buffer.from(await r.arrayBuffer()) }
  }
  return row.data ? { mime: row.mime, data: Buffer.from(row.data) } : null
}

export async function deleteMedia(id: string): Promise<void> {
  const row = await prisma.attachment.findUnique({ where: { id }, select: { storage: true } })
  if (!row) return
  if (row.storage === 'r2') await r2('DELETE', id).catch(() => {})
  await prisma.attachment.delete({ where: { id } }).catch(() => {})
}
