import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sniff } from '../../dist/lib/sniff.js'
import { sigV4 } from '../../dist/lib/sigv4.js'

const bytes = (...b) => Buffer.from([...b, ...Array(16).fill(0)])

test('sniff recognises pictures and audio by magic bytes', () => {
  assert.equal(sniff(Buffer.concat([Buffer.from('RIFF\0\0\0\0WEBP'), Buffer.alloc(8)])), 'image/webp')
  assert.equal(sniff(bytes(0xff, 0xd8, 0xff, 0xe0)), 'image/jpeg')
  assert.equal(sniff(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), 'image/png')
  assert.equal(sniff(Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(10)])), 'image/gif')
  assert.equal(sniff(bytes(0x1a, 0x45, 0xdf, 0xa3)), 'audio/webm')
  assert.equal(sniff(Buffer.concat([Buffer.from('OggS'), Buffer.alloc(10)])), 'audio/ogg')
  assert.equal(sniff(Buffer.concat([Buffer.from('\0\0\0\x20ftypM4A '), Buffer.alloc(8)])), 'audio/mp4')
})

test('sniff refuses things that could run in a browser', () => {
  for (const evil of ['<html><script>alert(1)</script>', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>', '%PDF-1.7 aaaaaaaa', 'MZ\x90\0aaaaaaaaaaaa']) {
    assert.equal(sniff(Buffer.from(evil)), null, evil.slice(0, 12))
  }
  assert.equal(sniff(Buffer.from('tiny')), null)
})

// the "GET Object" example from the AWS S3 SigV4 documentation
test('SigV4 matches the AWS documentation example', () => {
  const h = sigV4({
    method: 'GET', host: 'examplebucket.s3.amazonaws.com', path: '/test.txt', region: 'us-east-1', service: 's3',
    accessKey: 'AKIAIOSFODNN7EXAMPLE', secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    amzDate: '20130524T000000Z',
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    headers: { Range: 'bytes=0-9' },
  })
  assert.equal(h.authorization,
    'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, ' +
    'SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, ' +
    'Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41')
})
