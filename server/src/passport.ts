import passport from 'passport'
import passportGitHub from 'passport-github2'
import passportGoogle from 'passport-google-oauth20'
import { prisma } from './lib/prisma.js'
import { SERVER_URL } from './config.js'
import type { AuthUser } from './types.js'

type Done = (err: Error | null, user?: AuthUser) => void

// create or refresh the OAuth user and hand passport a plain AuthUser
async function upsertOAuthUser(provider: 'github' | 'google', profile: any, done: Done) {
  const username = profile.displayName ?? profile.username ?? 'Unknown'
  const avatar = profile.photos?.[0]?.value ?? null
  try {
    const user = await prisma.chatUser.upsert({
      where:  { provider_providerId: { provider, providerId: profile.id } },
      update: { username, avatar },
      create: { provider, providerId: profile.id, username, avatar, email: profile.emails?.[0]?.value ?? null },
    })
    return done(null, { id: user.id, username: user.username, avatar: user.avatar, email: user.email })
  } catch (err) {
    return done(err as Error)
  }
}

export function configurePassport() {
  passport.serializeUser((user: any, done: any) => done(null, user))
  passport.deserializeUser((user: any, done: any) => done(null, user))

  passport.use(new passportGitHub.Strategy(
    {
      clientID:     process.env.GITHUB_CLIENT_ID     || 'fake-github-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'fake-github-secret',
      callbackURL:  `${SERVER_URL}/auth/github/callback`,
    },
    (_a: string, _r: string, profile: any, done: Done) => upsertOAuthUser('github', profile, done),
  ))

  passport.use(new passportGoogle.Strategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID     || 'fake-google-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'fake-google-secret',
      callbackURL:  `${SERVER_URL}/auth/google/callback`,
    },
    (_a: string, _r: string, profile: any, done: Done) => upsertOAuthUser('google', profile, done),
  ))
}
