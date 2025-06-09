import { TRPCError } from '@trpc/server'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { verifyToken } from './supabase.js'
import { db } from './db.js'

// Create context from request
export async function createContext({ req, res }: CreateExpressContextOptions) {
  // Get token from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  let user = null
  if (token) {
    try {
      const supabaseUser = await verifyToken(token)
      // Get or create user profile in our database
      user = await getOrCreateUserProfile(supabaseUser)
    } catch (error) {
      // Token invalid, user remains null (guest mode)
      console.warn('Invalid token:', error)
    }
  }

  return {
    req,
    res,
    user,
    db
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

// Middleware to require authentication
export function requireAuth(ctx: Context) {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    })
  }
  return ctx.user
}

// Get or create user profile in our database
async function getOrCreateUserProfile(supabaseUser: any) {
  const existingUser = await db.user.findUnique({
    where: { id: supabaseUser.id }
  })

  if (existingUser) {
    return existingUser
  }

  // Create new user profile
  return await db.user.create({
    data: {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      username: supabaseUser.user_metadata?.username || null
    }
  })
} 