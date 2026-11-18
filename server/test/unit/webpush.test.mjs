import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { encryptPayload, vapidAuthorization, generateVapidKeys, isPushEndpoint } from '../../dist/lib/webpush.js'

const u = (s) => Buffer.from(s, 'base64url')

// RFC 8291 §5 / Appendix A, byte for byte
test('aes128gcm encryption matches the RFC 8291 example', () => {
  const out = encryptPayload(
    u('V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24'),
    'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
    'BTBZMqHH6r4Tts7J_aSIgg',
    { asPrivate: u('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw'), salt: u('DGv6ra1nlYgDCS1FRnbzlw'), rs: 4096 },
  )
  const header = 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8'
  const ciphertext = '8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ'
  assert.equal(out.subarray(0, 86).toString('base64url'), header)
  assert.equal(out.subarray(86).toString('base64url'), ciphertext)
})

test('VAPID: an ES256 JWT for the push service origin, verifiable with our public key', () => {
  const keys = { ...generateVapidKeys(), subject: 'mailto:test@example.com' }
  const auth = vapidAuthorization('https://fcm.googleapis.com/fcm/send/abc', keys, 1_700_000_000)
  const m = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(auth)
  assert.ok(m)
  const [, h, c, s, k] = m
  assert.equal(k, keys.publicKey)
  const claims = JSON.parse(Buffer.from(c, 'base64url'))
  assert.deepEqual(claims, { aud: 'https://fcm.googleapis.com', exp: 1_700_000_000 + 12 * 3600, sub: 'mailto:test@example.com' })
  const pub = u(keys.publicKey)
  const key = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') }, format: 'jwk' })
  assert.ok(crypto.verify('sha256', Buffer.from(`${h}.${c}`), { key, dsaEncoding: 'ieee-p1363' }, u(s)))
})

test('only real push services are accepted as endpoints', () => {
  for (const ok of ['https://fcm.googleapis.com/fcm/send/x', 'https://updates.push.services.mozilla.com/wpush/v2/x', 'https://web.push.apple.com/x', 'https://wns2-par02p.notify.windows.com/w/?token=x']) assert.ok(isPushEndpoint(ok), ok)
  for (const bad of ['http://fcm.googleapis.com/x', 'https://localhost/x', 'https://169.254.169.254/latest', 'https://evil.com/googleapis.com', 'https://googleapis.com.evil.com/x', 42]) assert.ok(!isPushEndpoint(bad), String(bad))
})
