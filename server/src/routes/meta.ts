import type { Express, Request, Response } from 'express'
import { BUILD } from '../config.js'

export function registerMetaRoutes(app: Express) {
  app.get('/ping', (_req: Request, res: Response) => res.send('ok'))
  app.get('/version', (_req: Request, res: Response) => res.json({ build: BUILD, features: ['reactions', 'seen', 'calls', 'profiles'] }))
}
