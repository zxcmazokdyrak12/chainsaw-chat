import crypto from 'crypto'

// Web Push without a library:
//   • payload encryption: RFC 8291 (ECDH P-256 + HKDF + AES-128-GCM, "aes128gcm" content coding)
//   • sender identity:    RFC 8292 VAPID (an ES256 JWT signed with our key)
// Keys: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY (base64url, `npm run vapid:keys`), VAPID_SUBJECT (mailto: or https:)

export const b64u = (b: Buffer | Uint8Array) => Buffer.from(b).toString('base64url')
export const unb64u = (s: string) => Buffer.from(s, 'base64url')

const hmac = (key: Buffer, data: Buffer) => crypto.createHmac('sha256', key).update(data).digest()

// RFC 8291 §3.4. `asPrivate` and `salt` are injectable only so the RFC's own example can be checked.
export function encryptPayload(
  plaintext: Buffer, uaPublicB64: string, authB64: string,
  opts: { asPrivate?: Buffer; salt?: Buffer; rs?: number } = {},
): Buffer {
  const uaPublic = unb64u(uaPublicB64)
  const authSecret = unb64u(authB64)
  if (uaPublic.length !== 65 || authSecret.length !== 16) throw new Error('bad subscription keys')

  const ecdh = crypto.createECDH('prime256v1')
  if (opts.asPrivate) ecdh.setPrivateKey(opts.asPrivate)
  else ecdh.generateKeys()
  const asPublic = ecdh.getPublicKey()
  const shared = ecdh.computeSecret(uaPublic)
  const salt = opts.salt ?? crypto.randomBytes(16)
  const rs = opts.rs ?? 4096

  // combine the ECDH secret with the auth secret
  const prkKey = hmac(authSecret, shared)
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic])
  const ikm = hmac(prkKey, Buffer.concat([keyInfo, Buffer.from([1])]))
  // derive the content key and nonce
  const prk = hmac(salt, ikm)
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01', 'binary')).subarray(0, 16)
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01', 'binary')).subarray(0, 12)

  // one record: plaintext + 0x02 (last-record delimiter)
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce)
  const body = Buffer.concat([cipher.update(Buffer.concat([plaintext, Buffer.from([2])])), cipher.final(), cipher.getAuthTag()])

  const header = Buffer.alloc(16 + 4 + 1)
  salt.copy(header, 0)
  header.writeUInt32BE(rs, 16)
  header.writeUInt8(asPublic.length, 20)
  return Buffer.concat([header, asPublic, body])
}

// RFC 8292: Authorization: vapid t=<ES256 JWT>, k=<public key>
export function vapidAuthorization(endpoint: string, keys: { publicKey: string; privateKey: string; subject: string }, nowSec = Math.floor(Date.now() / 1000)): string {
  const pub = unb64u(keys.publicKey)
  const jwk = { kty: 'EC', crv: 'P-256', d: keys.privateKey, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }
  const key = crypto.createPrivateKey({ key: jwk, format: 'jwk' })
  const head = b64u(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64u(Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: nowSec + 12 * 3600, sub: keys.subject })))
  const sig = crypto.sign('sha256', Buffer.from(`${head}.${claims}`), { key, dsaEncoding: 'ieee-p1363' })
  return `vapid t=${head}.${claims}.${b64u(sig)}, k=${keys.publicKey}`
}

export function generateVapidKeys() {
  const ecdh = crypto.createECDH('prime256v1')
  ecdh.generateKeys()
  return { publicKey: b64u(ecdh.getPublicKey()), privateKey: b64u(ecdh.getPrivateKey()) }
}

// only real push services: the endpoint comes from the browser, so it must not become an SSRF hole
const PUSH_HOSTS = [/\.googleapis\.com$/, /\.mozilla\.com$/, /\.push\.apple\.com$/, /\.notify\.windows\.com$/, /^web\.push\.apple\.com$/]
export function isPushEndpoint(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 1024) return false
  try {
    const u = new URL(v)
    return u.protocol === 'https:' && PUSH_HOSTS.some(re => re.test(u.hostname))
  } catch { return false }
}
