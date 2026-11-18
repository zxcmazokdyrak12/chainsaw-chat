import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePollCommand, castVote } from '../../dist/lib/polls.js'

test('parses /contract and /poll', () => {
  const c = parsePollCommand('/contract  Raid the Gun Devil tonight ')
  assert.equal(c.kind, 'contract')
  assert.equal(c.title, 'Raid the Gun Devil tonight')
  assert.deepEqual(c.options, [{ id: 'sign', label: 'SIGN' }])

  const p = parsePollCommand('/POLL Where do we eat? | Ramen | Pizza | ramen? | Pizza')
  assert.equal(p.kind, 'poll')
  assert.deepEqual(p.options.map(o => o.label), ['Ramen', 'Pizza', 'ramen?'])
})

test('rejects junk', () => {
  for (const bad of ['/poll only a title', '/poll | a | b', '/contract', '/contract    ', 'contract x', 'hello']) {
    assert.equal(parsePollCommand(bad), null, bad)
  }
  assert.equal(parsePollCommand('/poll q | ' + Array.from({ length: 10 }, (_, i) => `o${i}`).join(' | ')).options.length, 6)
})

test('one seal per person in a poll; contracts toggle', () => {
  let p = parsePollCommand('/poll Q | A | B')
  p = castVote(p, 'o1', 'DENJI')
  p = castVote(p, 'o1', 'POWER')
  p = castVote(p, 'o2', 'DENJI')          // DENJI moves his seal
  assert.deepEqual(p.votes, { o1: ['POWER'], o2: ['DENJI'] })
  p = castVote(p, 'o2', 'DENJI')          // and takes it back
  assert.deepEqual(p.votes, { o1: ['POWER'] })
  assert.equal(castVote(p, 'o9', 'AKI'), null)
  assert.equal(castVote({ ...p, closed: true }, 'o1', 'AKI'), null)

  let c = parsePollCommand('/contract Eat pudding')
  c = castVote(c, 'sign', 'DENJI')
  assert.deepEqual(c.votes, { sign: ['DENJI'] })
  assert.deepEqual(castVote(c, 'sign', 'DENJI').votes, {})
})
