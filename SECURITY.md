# Security

How Chainsaw Chat protects its users, and how to report a problem.

## Reporting

Found a vulnerability? Please open a [private security advisory](https://github.com/zxcmazokdyrak12/chainsaw-chat/security/advisories/new) instead of a public issue.

## Model

**Identity comes from the server, never from the client.**
Every socket must present a signed JWT on connect (`handshake.auth.token`). The server takes the username from that token and ignores any `username` field inside events.

- Accounts (password, GitHub, Google) get a 7–30 day token.
- Guests get a 1-day signed name from `POST /auth/guest`. Nicknames that belong to an account, or that someone is using right now, are refused.
- OAuth display names that collide with an existing account get a suffix (`NAME_GH`), so nobody can post as somebody else.

**Rooms are private by membership.**
`general` is the public lobby. Every other room is reachable only by its join code. Reading history, posting, reacting, calling, and marking messages as seen all check the membership. Knowing a room id is not enough.

| Area | Measure |
|---|---|
| Passwords | bcrypt (cost 12), 8–72 chars. Login runs the hash even for unknown nicknames, so timing doesn't reveal which ones exist |
| Tokens | HS256 only (`alg` pinned on verify). In production a missing `JWT_SECRET` produces a random per-boot secret, never a hardcoded one |
| OAuth | `state` parameter against login CSRF. The token returns in the URL `#fragment`, so it never reaches server logs or `Referer` headers |
| Messages | delete/edit only your own. Text ≤ 2000 chars, control characters stripped. Voice must be a `data:audio/*;base64` URL ≤ ~3 MB |
| Uploads | `POST /media` needs a token and a membership of the room. Type is decided by magic bytes (webp/jpeg/png/gif, webm/ogg/m4a/mp3), never by the header. ≤ 2.5 MB, 40 per 10 min per user. Served with `Content-Security-Policy: sandbox` under a random UUID. A message can only use an upload made by the same user, in the same room |
| Avatars | only `/avatars/*` or the GitHub/Google avatar CDNs, so no tracking pixels in other people's chat |
| Room codes | 2.5 M combinations, crypto RNG, 8 wrong tries per minute per socket |
| Flooding | HTTP: 120 req/min per IP; 20 auth attempts per 15 min. Sockets: 150 events / 10 s, 30 messages / min, 10 new rooms / hour |
| Calls | signaling relays only between peers of the same call, payload ≤ 20 KB. TURN credentials are short-lived and minted by `GET /ice` for logged-in users only |
| HTTP | `helmet`, JSON body ≤ 20 KB, `x-powered-by` off, no stack traces in responses, session cookie `httpOnly` + `secure` + `sameSite=lax`, 10 min |
| Client | CSP, `nosniff`, HSTS, `frame-ancestors 'none'`, camera/mic limited to the app itself (see `client/vercel.json`) |

## Known limits

- Account tokens live in `localStorage`. The CSP blocks injected scripts, but an XSS would still be able to read them. Moving them to `httpOnly` cookies needs the API and the client on one site.
- Rate limits and presence live in memory: one server instance, reset on restart.
- Uploads live in Postgres unless `R2_*` is set; at scale, object storage is the right place.
- Anyone holding a media link can open it (the id is the capability, like most chat CDNs).
