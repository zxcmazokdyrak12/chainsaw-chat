import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { generateCode } from '../../dist/lib/codes.js'
import { coturnCredentials } from '../../dist/routes/ice.js'

test('room codes: 2 syllables + 4 digits, and they vary', () => {
  const codes = new Set(Array.from({ length: 300 }, generateCode))
  for (const c of codes) assert.match(c, /^[A-Z]{6}\d{4}$/)
  assert.ok(codes.size > 290, 'codes repeat way too often')
})

test('coturn REST credentials: expiry:tag + HMAC-SHA1', () => {
  const { username, credential } = coturnCredentials('s3cret', 1_700_000_000_000, 3600)
  assert.equal(username, '1700003600:chainsaw')
  assert.equal(credential, crypto.createHmac('sha1', 's3cret').update(username).digest('base64'))
})
