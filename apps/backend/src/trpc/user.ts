import { z } from 'zod'
import { router, publicProcedure } from './trpc.js'
import { requireAuth } from '../lib/auth.js'

export const userRouter = router({
  // Get current user profile (requires auth)
  getProfile: publicProcedure
    .query(async ({ ctx }) => {
      const user = requireAuth(ctx)
      
      // Get user with stats
      const userWithStats = await ctx.db.user.findUnique({
        where: { id: user.id },
        include: {
          guesses: {
            select: {
              score: true,
              createdAt: true,
              mode: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10 // Last 10 games
          }
        }
      })

      if (!userWithStats) {
        throw new Error('User profile not found')
      }

      // Calculate stats
      const totalGames = userWithStats.guesses.length
      const avgScore = totalGames > 0 
        ? Math.round(userWithStats.guesses.reduce((acc: number, g: any) => acc + g.score, 0) / totalGames)
        : 0
      const bestScore = totalGames > 0 
        ? Math.max(...userWithStats.guesses.map((g: any) => g.score))
        : 0

      return {
        id: userWithStats.id,
        username: userWithStats.username,
        email: userWithStats.email,
        createdAt: userWithStats.createdAt,
        stats: {
          totalGames,
          avgScore,
          bestScore,
          recentGames: userWithStats.guesses
        }
      }
    }),

  // Update user profile (requires auth)
  updateProfile: publicProcedure
    .input(z.object({
      username: z.string().min(2).max(20).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const user = requireAuth(ctx)

      // Check if username is already taken
      if (input.username) {
        const existingUser = await ctx.db.user.findUnique({
          where: { username: input.username }
        })
        
        if (existingUser && existingUser.id !== user.id) {
          throw new Error('Username already taken')
        }
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: user.id },
        data: {
          username: input.username ?? null
        }
      })

      return {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email
      }
    }),

  // Check if user is authenticated (public)
  getSession: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        return { authenticated: false, user: null }
      }

      return {
        authenticated: true,
        user: {
          id: ctx.user.id,
          username: ctx.user.username,
          email: ctx.user.email
        }
      }
    })
}) 