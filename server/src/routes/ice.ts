import type { Express, Request, Response } from 'express'
import crypto from 'crypto'
import { readToken } from '../lib/tokens.js'

// ICE servers for video calls. STUN alone fails behind strict NAT / mobile networks — TURN relays the
// media then. TURN credentials are minted here, short-lived, so no TURN password ships in the client bundle.
//
// Pick ONE provider via env (checked in this order):
//  • Cloudflare Realtime TURN (free tier 1 TB/month):  CF_TURN_KEY_ID + CF_TURN_API_TOKEN
//  • Metered.ca (free tier 500 MB/month):               METERED_DOMAIN + METERED_API_KEY
//  • your own coturn with use-auth-secret:              TURN_URLS (comma-separated) + TURN_SECRET

type Ice = { urls: string | string[]; username?: string; credential?: string }
const STUN: Ice[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }]
const TTL = 6 * 3600

let cache: { at: number; servers: Ice[] } | null = null

async function cloudflare(): Promise<Ice[] | null> {
  const id = process.env.CF_TURN_KEY_ID, token = process.env.CF_TURN_API_TOKEN
  if (!id || !token) return null
  const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${id}/credentials/generate-ice-servers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl: TTL }),
  })
  if (!r.ok) throw new Error(`cloudflare ${r.status}`)
  const j = await r.json() as { iceServers?: Ice | Ice[] }
  return j.iceServers ? ([] as Ice[]).concat(j.iceServers) : null
}

async function metered(): Promise<Ice[] | null> {
  const domain = process.env.METERED_DOMAIN, key = process.env.METERED_API_KEY
  if (!domain || !key) return null
  const r = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(key)}`)
  if (!r.ok) throw new Error(`metered ${r.status}`)
  return await r.json() as Ice[]
}

// coturn "TURN REST API": username = expiry:tag, credential = base64(HMAC-SHA1(secret, username))
function coturn(): Ice[] | null {
  const urls = process.env.TURN_URLS, secret = process.env.TURN_SECRET
  if (!urls || !secret) return null
  const username = `${Math.floor(Date.now() / 1000) + TTL}:chainsaw`
  const credential = crypto.createHmac('sha1', secret).update(username).digest('base64')
  return [...STUN, { urls: urls.split(',').map(u => u.trim()), username, credential }]
}

async function iceServers(): Promise<Ice[]> {
  // credentials live 6 h; hand out the same set for an hour
  if (cache && Date.now() - cache.at < 3600_000) return cache.servers
  let servers: Ice[] | null = null
  try { servers = (await cloudflare()) ?? (await metered()) ?? coturn() } catch (err) {
    console.error('[ICE] TURN provider failed, falling back to STUN:', (err as Error).message)
  }
  if (!servers) return STUN
  cache = { at: Date.now(), servers }
  return servers
}

export function registerIceRoutes(app: Express) {
  // logged-in users and signed guests only — otherwise anyone could burn our TURN quota
  app.get('/ice', async (req: Request, res: Response) => {
    if (!readToken(req)) { res.status(401).json({ error: 'Log in first' }); return }
    res.set('Cache-Control', 'no-store')
    res.json({ iceServers: await iceServers() })
  })
}
