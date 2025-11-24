import NextAuth from 'next-auth/next'
import { authConfig } from '../../../src/lib/auth-config'

const handler = NextAuth(authConfig)

export default handler
