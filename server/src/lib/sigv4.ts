import crypto from 'crypto'

// AWS Signature V4 (what S3 / Cloudflare R2 expect), written out by hand so the server needs no AWS SDK.

export const sha256 = (data: string | Buffer) => crypto.createHash('sha256').update(data).digest('hex')
const hmac = (key: crypto.BinaryLike, data: string) => crypto.createHmac('sha256', key).update(data).digest()

// AWS Signature V4 for one request. Exported for the unit test against AWS's documented example.
export function sigV4(o: {
  method: string; host: string; path: string; region: string; service: string
  accessKey: string; secretKey: string; amzDate: string; payloadHash: string
  headers?: Record<string, string>
}): Record<string, string> {
  const date = o.amzDate.slice(0, 8)
  const headers: Record<string, string> = {
    host: o.host, 'x-amz-content-sha256': o.payloadHash, 'x-amz-date': o.amzDate,
    ...Object.fromEntries(Object.entries(o.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])),
  }
  const names = Object.keys(headers).sort()
  const canonical = [
    o.method,
    o.path.split('/').map(seg => encodeURIComponent(decodeURIComponent(seg))).join('/'),
    '',
    names.map(n => `${n}:${String(headers[n]).trim()}\n`).join(''),
    names.join(';'),
    o.payloadHash,
  ].join('\n')
  const scope = `${date}/${o.region}/${o.service}/aws4_request`
  const toSign = ['AWS4-HMAC-SHA256', o.amzDate, scope, sha256(canonical)].join('\n')
  const kDate = hmac(`AWS4${o.secretKey}`, date)
  const kSigning = hmac(hmac(hmac(kDate, o.region), o.service), 'aws4_request')
  const signature = crypto.createHmac('sha256', kSigning).update(toSign).digest('hex')
  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${o.accessKey}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}`,
  }
}
