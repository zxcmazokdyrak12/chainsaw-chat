// End-to-end checks against a running server: real HTTP, real Socket.IO, real database.
//   CI: a throwaway Postgres (see .github/workflows/ci.yml)
//   local: TEST_DATABASE_URL=postgres://… npm run build && npm run test:integration
//          (never point it at the production database — it creates users and rooms)
//   or against a server you already started: TEST_SERVER_URL=http://localhost:3001
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { io } from 'socket.io-client'

const DB = process.env.TEST_DATABASE_URL
const EXTERNAL = process.env.TEST_SERVER_URL
const skip = !DB && !EXTERNAL && 'set TEST_DATABASE_URL (throwaway DB) or TEST_SERVER_URL to run'
const PORT = 3998
const URL = EXTERNAL ?? `http://localhost:${PORT}`
let server

// one hook, in order: root-level `before` hooks of node:test may run concurrently
async function startServer() {
  if (EXTERNAL) return
  server = spawn(process.execPath, ['dist/index.js'], {
    env: { ...process.env, DATABASE_URL: DB, PORT: String(PORT), JWT_SECRET: 'integration-secret-'.padEnd(40, 'x'), CLIENT_URL: 'http://localhost:5173', NODE_ENV: 'test' },
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${URL}/ping`)).ok) return } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error('server did not start')
}
after(() => server?.kill())

// ── helpers ───────────────────────────────────────────────────────
const tag = Math.random().toString(36).slice(2, 7).toUpperCase()
const nick = (p) => `${p}${tag}`.slice(0, 14)

async function post(path, body, token) {
  const r = await fetch(URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  return { status: r.status, body: await r.json().catch(() => ({})) }
}

const sockets = []
function connect(token) {
  return new Promise((resolve) => {
    const s = io(URL, { transports: ['websocket'], auth: token ? { token } : {}, reconnection: false, forceNew: true })
    sockets.push(s)
    s.on('connect', () => resolve(s))
    s.on('connect_error', (e) => resolve(`ERR:${e.message}`))
  })
}
after(() => sockets.forEach(s => typeof s !== 'string' && s.close()))

const waitFor = (s, event, ms = 1500) => new Promise((resolve) => {
  const t = setTimeout(() => { s.off(event, on); resolve(undefined) }, ms)
  const on = (v) => { clearTimeout(t); resolve(v) }
  s.once(event, on)
})
async function enter(s, roomId) {
  const h = waitFor(s, 'room_history')
  s.emit('join_room', { roomId })
  return h
}
async function say(s, roomId, content, extra = {}) {
  const got = waitFor(s, 'receive_message')
  s.emit('send_message', { roomId, content, ...extra })
  return got
}

// ── shared cast ───────────────────────────────────────────────────
let denji, power, denjiTok, powerTok
before(async () => {
  if (skip) return
  await startServer()
  const reg = await post('/auth/register', { username: nick('D'), password: 'pochita-1234' })
  assert.equal(reg.status, 200, JSON.stringify(reg.body))
  denjiTok = reg.body.token
  const guest = await post('/auth/guest', { username: nick('P') })
  assert.equal(guest.status, 200, JSON.stringify(guest.body))
  powerTok = guest.body.token
  denji = await connect(denjiTok)
  power = await connect(powerTok)
  await enter(denji, 'general')
  await enter(power, 'general')
})

// ── tests ─────────────────────────────────────────────────────────
test('sockets without a valid token are refused', { skip }, async () => {
  assert.equal(await connect(null), 'ERR:unauthorized')
  assert.equal(await connect('eyJhbGciOiJub25lIn0.eyJ1c2VybmFtZSI6Ik1BS0lNQSJ9.'), 'ERR:unauthorized')
})

test("a guest can't take an account's name", { skip }, async () => {
  const r = await post('/auth/guest', { username: nick('D').toLowerCase() })
  assert.equal(r.status, 409)
})

test('the username comes from the token, not the payload', { skip }, async () => {
  const msg = await say(power, 'general', 'i am denji', { username: nick('D'), avatar: 'https://evil.example/px.gif' })
  assert.equal(msg.username, nick('P'))
  assert.equal(msg.avatar, null)
})

test('a private room is closed to non-members, even with its id', { skip }, async () => {
  const created = waitFor(denji, 'room_created')
  denji.emit('create_room', { roomName: 'secret' })
  const room = await created
  assert.ok(room?.id)

  const err = waitFor(power, 'join_error')
  power.emit('join_room', { roomId: room.id })
  assert.equal(await err, 'You are not in this room')

  await enter(denji, room.id)
  const leaked = waitFor(denji, 'receive_message', 700)
  power.emit('send_message', { roomId: room.id, content: 'sneaky' })
  assert.equal(await leaked, undefined)

  // with the code it works
  const ok = waitFor(power, 'join_by_code_success')
  power.emit('join_by_code', { code: room.code })
  assert.equal((await ok)?.roomId, room.id)
  await enter(denji, 'general')
})

test("you can delete your own lines, not other people's", { skip }, async () => {
  const mine = await say(denji, 'general', 'keep me')
  const nope = waitFor(denji, 'message_deleted', 700)
  power.emit('delete_message', { messageId: mine.id, roomId: 'general' })
  assert.equal(await nope, undefined)

  const yes = waitFor(power, 'message_deleted')
  denji.emit('delete_message', { messageId: mine.id, roomId: 'general' })
  assert.equal((await yes)?.messageId, mine.id)
})

test('a reply carries a snapshot of the quoted line', { skip }, async () => {
  const q = await say(denji, 'general', 'who ate my pudding')
  const r = await say(power, 'general', 'not me', { replyTo: q.id })
  assert.equal(r.replyTo.id, q.id)
  assert.equal(r.replyTo.username, nick('D'))
  assert.equal(r.replyTo.content, 'who ate my pudding')
})

test('search finds lines in the room', { skip }, async () => {
  const word = `pudding${tag}`.toLowerCase()
  await say(denji, 'general', `the ${word} is gone`)
  const res = waitFor(denji, 'search_results')
  denji.emit('search_messages', { roomId: 'general', q: word.toUpperCase() })
  const { results } = await res
  assert.ok(results.some(h => h.content.includes(word)))
})

test('uploads: pictures yes, HTML pretending to be a picture no', { skip }, async () => {
  const upload = (bytes, type, token = denjiTok) => fetch(`${URL}/media?roomId=general`, {
    method: 'POST', headers: { 'Content-Type': type, Authorization: `Bearer ${token}` }, body: bytes,
  })
  assert.equal((await upload(Buffer.from('<html><script>alert(1)</script></html>'), 'image/png')).status, 415)
  assert.equal((await fetch(`${URL}/media?roomId=general`, { method: 'POST', body: Buffer.from('x') })).status, 401)

  // 1×1 PNG
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64')
  const up = await upload(png, 'image/png')
  assert.equal(up.status, 200)
  const { id } = await up.json()

  const got = await fetch(`${URL}/media/${id}`)
  assert.equal(got.headers.get('content-type'), 'image/png')
  assert.match(got.headers.get('content-security-policy') ?? '', /sandbox/)
  assert.deepEqual(Buffer.from(await got.arrayBuffer()), png)

  // somebody else can't post my upload as theirs
  const stolen = waitFor(denji, 'receive_message', 700)
  power.emit('send_message', { roomId: 'general', type: 'image', mediaId: id })
  assert.equal(await stolen, undefined)

  const pic = await say(denji, 'general', 'look', { type: 'image', mediaId: id })
  assert.equal(pic.type, 'image')
  assert.equal(pic.media, id)
})

test('contracts: members seal them, only the author closes them', { skip }, async () => {
  const c = await say(denji, 'general', '/poll Where do we eat? | Ramen | Pizza')
  assert.equal(c.type, 'contract')
  assert.deepEqual(c.poll.options.map(o => o.label), ['Ramen', 'Pizza'])

  let upd = waitFor(denji, 'poll_updated')
  power.emit('poll_vote', { messageId: c.id, roomId: 'general', optionId: 'o2' })
  assert.deepEqual((await upd).poll.votes, { o2: [nick('P')] })

  const ignored = waitFor(denji, 'poll_updated', 700)
  power.emit('poll_close', { messageId: c.id, roomId: 'general' })
  assert.equal(await ignored, undefined)

  upd = waitFor(power, 'poll_updated')
  denji.emit('poll_close', { messageId: c.id, roomId: 'general' })
  assert.equal((await upd).poll.closed, true)
})

test('"joined the room" is not repeated for a second tab or a quick re-join', { skip }, async () => {
  const tab2 = await connect(powerTok)
  const heard = waitFor(denji, 'user_joined', 700)
  await enter(tab2, 'general')
  assert.equal(await heard, undefined)
  tab2.close()
})

test('room codes can not be brute-forced', { skip }, async () => {
  const errors = []
  for (let i = 0; i < 10; i++) {
    const e = waitFor(power, 'join_error')
    power.emit('join_by_code', { code: `ZZZZZZ${1000 + i}` })
    errors.push(await e)
  }
  assert.equal(errors.at(-1), 'Too many tries — wait a minute')
})
