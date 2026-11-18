import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NICK_RE, normalizeNick, safeAvatar, safeAudio, isRoomId, isId } from '../../dist/lib/validate.js'

test('nicknames: 2–14 letters / digits / _ -, any case → upper', () => {
  assert.equal(normalizeNick('  denji '), 'DENJI')
  for (const ok of ['DENJI', 'АКИ', 'POWER_2', 'A-1']) assert.ok(NICK_RE.test(ok), ok)
  for (const bad of ['D', 'X'.repeat(15), 'DEN JI', '<IMG>', 'DENJI\u0000']) assert.ok(!NICK_RE.test(bad), bad)
  assert.equal(normalizeNick(42), '')
})

test('avatars: only our pictures or the OAuth CDNs', () => {
  assert.equal(safeAvatar('/avatars/avatar_denji.png'), '/avatars/avatar_denji.png')
  assert.equal(safeAvatar('https://avatars.githubusercontent.com/u/1?v=4'), 'https://avatars.githubusercontent.com/u/1?v=4')
  assert.equal(safeAvatar('https://lh3.googleusercontent.com/a/xyz'), 'https://lh3.googleusercontent.com/a/xyz')
  for (const bad of [
    'javascript:alert(1)', 'http://avatars.githubusercontent.com/u/1', 'https://evil.example/px.gif',
    '//evil.example/x.png', '/avatars/../../etc/passwd', '/avatars/x.svg', 'https://avatars.githubusercontent.com.evil.example/a',
    'x'.repeat(400), null, 7,
  ]) assert.equal(safeAvatar(bad), null, String(bad))
})

test('voice data URLs: audio base64 only', () => {
  assert.ok(safeAudio('data:audio/webm;codecs=opus;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYEC'))
  assert.equal(safeAudio('data:text/html;base64,PHNjcmlwdD4='), null)
  assert.equal(safeAudio('data:audio/webm;base64,<script>'), null)
  assert.equal(safeAudio('data:audio/webm;base64,' + 'A'.repeat(4_100_000)), null)
})

test('ids', () => {
  assert.ok(isRoomId('general') && isRoomId('a1b2c3d4e5f6a7b8c9d0'))
  assert.ok(!isRoomId('../etc') && !isRoomId('') && !isRoomId('x'.repeat(33)) && !isRoomId({}))
  assert.ok(isId(1763425200000) && !isId(-1) && !isId(1.5) && !isId('5') && !isId(2 ** 60))
})
