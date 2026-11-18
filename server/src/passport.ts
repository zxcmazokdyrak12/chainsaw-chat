import passport from 'passport'
import passportGitHub from 'passport-github2'
import passportGoogle from 'passport-google-oauth20'
import { prisma } from './lib/prisma.js'
import { SERVER_URL } from './config.js'
import { safeAvatar } from './lib/validate.js'
import type { AuthUser } from './types.js'

type Done = (err: Error | null, user?: AuthUser) => void

// OAuth display names are free text. The chat identifies people by name, so an OAuth name must not
// collide with a password account ("DENJI") or with another OAuth user — otherwise you could post as them.
async function freeName(base: string, provider: string, providerId: string): Promise<string> {
  const clean = base.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 32) || 'Hunter'
  const tag = provider === 'github' ? 'GH' : 'G'
  for (const candidate of [clean, `${clean}_${tag}`, `${clean}_${tag}${providerId.slice(-4)}`]) {
    const [local, other] = await Promise.all([
      prisma.localUser.findFirst({ where: { username: { equals: candidate, mode: 'insensitive' } }, select: { id: true } }),
      prisma.chatUser.findFirst({
        where: { username: { equals: candidate, mode: 'insensitive' }, NOT: { provider, providerId } },
        select: { id: true },
      }),
    ])
    if (!local && !other) return candidate
  }
  return `${tag}_${providerId}`.slice(0, 32)
}

// create or refresh the OAuth user and hand passport a plain AuthUser
async function upsertOAuthUser(provider: 'github' | 'google', profile: any, done: Done) {
  try {
    const providerId = String(profile.id)
    const username = await freeName(String(profile.displayName || profile.username || 'Hunter'), provider, providerId)
    const avatar = safeAvatar(profile.photos?.[0]?.value)
    const user = await prisma.chatUser.upsert({
      where:  { provider_providerId: { provider, providerId } },
      update: { username, avatar },
      create: { provider, providerId, username, avatar, email: profile.emails?.[0]?.value ?? null },
    })
    return done(null, { id: user.id, username: user.username, avatar: user.avatar })
  } catch (err) {
    return done(err as Error)
  }
}

export function configurePassport() {
  // the session only lives for the OAuth round-trip (it holds the anti-CSRF `state`)
  passport.serializeUser((user: any, done: any) => done(null, user))
  passport.deserializeUser((user: any, done: any) => done(null, user))

  passport.use(new passportGitHub.Strategy(
    {
      clientID:     process.env.GITHUB_CLIENT_ID     || 'fake-github-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'fake-github-secret',
      callbackURL:  `${SERVER_URL}/auth/github/callback`,
      state:        true,
    } as any,
    (_a: string, _r: string, profile: any, done: Done) => upsertOAuthUser('github', profile, done),
  ))

  passport.use(new passportGoogle.Strategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID     || 'fake-google-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'fake-google-secret',
      callbackURL:  `${SERVER_URL}/auth/google/callback`,
      state:        true,
    } as any,
    (_a: string, _r: string, profile: any, done: Done) => upsertOAuthUser('google', profile, done),
  ))
}
