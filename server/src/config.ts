import dotenv from 'dotenv'
import path from 'path'

// load server/.env before anything reads process.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export const JWT_SECRET = process.env.JWT_SECRET ?? 'CHAINSAW_REZE_DENJI_LOVE_2025'
export const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173'
export const SERVER_URL = process.env.SERVER_URL ?? 'https://chainsaw-chat.onrender.com'
export const PORT = process.env.PORT ?? 3001

// open /version after a deploy to make sure Render runs the fresh build
export const BUILD = 'modules-v4'
