import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long'
const { signToken, signGuestToken, verifyToken } = await import('../../dist/lib/tokens.js')

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')

test('a signed token round-trips', () => {
  const t = signToken({ id: 7, username: 'DENJI', avatar: null })
  const p = verifyToken(t)
  assert.equal(p.username, 'DENJI')
  assert.equal(p.id, 7)
  assert.ok(!p.guest)
})

test('guest tokens are marked as guests', () => {
  const p = verifyToken(signGuestToken('POWER', '/avatars/avatar_power.png', 'gid-1'))
  assert.equal(p.username, 'POWER')
  assert.equal(p.guest, true)
})

test('alg:none, foreign secrets and tampering are rejected', () => {
  const none = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ id: 1, username: 'MAKIMA' })}.`
  assert.equal(verifyToken(none), null)

  const head = b64({ alg: 'HS256', typ: 'JWT' }), body = b64({ id: 1, username: 'MAKIMA', avatar: null })
  const sig = crypto.createHmac('sha256', 'CHAINSAW_REZE_DENJI_LOVE_2025').update(`${head}.${body}`).digest('base64url')
  assert.equal(verifyToken(`${head}.${body}.${sig}`), null, 'the old public fallback secret must not work')

  const real = signToken({ id: 7, username: 'DENJI', avatar: null })
  const [h, , s] = real.split('.')
  assert.equal(verifyToken(`${h}.${b64({ id: 7, username: 'MAKIMA', avatar: null })}.${s}`), null)
})

test('junk is rejected', () => {
  for (const junk of [undefined, null, '', 'abc', 42, 'x'.repeat(5000)]) assert.equal(verifyToken(junk), null)
})
