import '../config.js'
import { PrismaClient } from '@prisma/client'

// one client for the whole server
export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
})
