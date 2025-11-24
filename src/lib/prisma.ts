import { PrismaClient } from '@prisma/client'

declare global {
  // allow global `var` in development to prevent multiple instances
  // eslint-disable-next-line vars-on-top, no-var
  var __prismaClient: PrismaClient | undefined
}

const prisma = global.__prismaClient || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.__prismaClient = prisma

export default prisma
