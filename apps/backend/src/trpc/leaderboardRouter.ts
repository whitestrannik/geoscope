import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './trpc.js';
import { TRPCError } from '@trpc/server';

export const leaderboardRouter = router({
  // Get global top players based on their best scores
  getGlobalTop: publicProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(10),
      mode: z.enum(['solo', 'multiplayer', 'all']).default('all')
    }))
    .query(async ({ input, ctx }) => {
      const { limit, mode } = input;
      
      try {
        // Get top players based on their highest single game score
        const topPlayers = await ctx.db.$queryRaw<Array<{
          id: string;
          username: string | null;
          email: string;
          best_score: number;
          total_games: bigint;
          avg_score: number;
          best_distance: number;
          last_played: Date;
        }>>`
          SELECT 
            u.id,
            u.username,
            u.email,
            MAX(g.score) as best_score,
            COUNT(g.id) as total_games,
            AVG(g.score::float) as avg_score,
            MIN(g.distance) as best_distance,
            MAX(g.created_at) as last_played
          FROM users u
          INNER JOIN guesses g ON u.id = g.user_id
          WHERE g.user_id IS NOT NULL 
            ${mode !== 'all' ? `AND g.mode = ${mode}` : ''}
          GROUP BY u.id, u.username, u.email
          ORDER BY best_score DESC, avg_score DESC
          LIMIT ${limit}
        `;

        return topPlayers.map((player, index: number) => ({
          rank: index + 1,
          id: player.id,
          username: player.username || player.email.split('@')[0],
          bestScore: Number(player.best_score),
          totalGames: Number(player.total_games),
          avgScore: Math.round(Number(player.avg_score)),
          bestDistance: Number(player.best_distance),
          lastPlayed: player.last_played
        }));

      } catch (error) {
        console.error('Error fetching global leaderboard:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch leaderboard'
        });
      }
    }),

  // Get recent top performers from the last 24 hours
  getRecentWinners: publicProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(20).default(10),
      hours: z.number().int().min(1).max(168).default(24) // 1 hour to 1 week
    }))
    .query(async ({ input, ctx }) => {
      const { limit, hours } = input;
      
      try {
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        
        const recentWinners = await ctx.db.guess.findMany({
          where: {
            userId: { not: null },
            createdAt: { gte: cutoffTime }
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            },
            room: {
              select: {
                id: true,
                totalRounds: true
              }
            }
          },
          orderBy: [
            { score: 'desc' },
            { distance: 'asc' },
            { createdAt: 'desc' }
          ],
          take: limit
        });

        return recentWinners.map((guess, index) => ({
          rank: index + 1,
          id: guess.user!.id,
          username: guess.user!.username || guess.user!.email.split('@')[0],
          score: guess.score,
          distance: guess.distance,
          mode: guess.mode,
          roomId: guess.roomId,
          roundIndex: guess.roundIndex,
          timestamp: guess.createdAt
        }));

      } catch (error) {
        console.error('Error fetching recent winners:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch recent winners'
        });
      }
    }),

  // Get personal stats for authenticated user
  getPersonalStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      
      try {
        // Get comprehensive stats for the user
        const stats = await ctx.db.$queryRaw<Array<{
          total_games: bigint;
          solo_games: bigint;
          multiplayer_games: bigint;
          best_score: number | null;
          avg_score: number | null;
          best_distance: number | null;
          avg_distance: number | null;
          total_distance: number | null;
          last_played: Date | null;
          first_played: Date | null;
        }>>`
          SELECT 
            COUNT(g.id) as total_games,
            COUNT(CASE WHEN g.mode = 'solo' THEN 1 END) as solo_games,
            COUNT(CASE WHEN g.mode = 'multiplayer' THEN 1 END) as multiplayer_games,
            MAX(g.score) as best_score,
            AVG(g.score::float) as avg_score,
            MIN(g.distance) as best_distance,
            AVG(g.distance::float) as avg_distance,
            SUM(g.distance) as total_distance,
            MAX(g.created_at) as last_played,
            MIN(g.created_at) as first_played
          FROM guesses g
          WHERE g.user_id = ${userId}
        `;

        const userStats = stats[0];

        // Get recent games for history
        const recentGames = await ctx.db.guess.findMany({
          where: { userId },
          include: {
            room: {
              select: {
                id: true,
                totalRounds: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        });

        // Calculate rank
        const globalRank = await ctx.db.$queryRaw<Array<{
          rank: bigint;
        }>>`
          SELECT COUNT(*) + 1 as rank
          FROM (
            SELECT user_id, MAX(score) as best_score
            FROM guesses 
            WHERE user_id IS NOT NULL
            GROUP BY user_id
            HAVING MAX(score) > (
              SELECT MAX(score) FROM guesses WHERE user_id = ${userId}
            )
          ) ranked_users
        `;

        const rank = Number(globalRank[0]?.rank || 1);

        // Handle case where user might not have any games yet
        if (!userStats) {
          return {
            totalGames: 0,
            soloGames: 0,
            multiplayerGames: 0,
            bestScore: 0,
            avgScore: 0,
            bestDistance: 0,
            avgDistance: 0,
            totalDistance: 0,
            globalRank: rank,
            lastPlayed: null,
            firstPlayed: null,
            recentGames: []
          };
        }

        return {
          totalGames: Number(userStats.total_games) || 0,
          soloGames: Number(userStats.solo_games) || 0,
          multiplayerGames: Number(userStats.multiplayer_games) || 0,
          bestScore: Number(userStats.best_score) || 0,
          avgScore: Math.round(Number(userStats.avg_score)) || 0,
          bestDistance: Number(userStats.best_distance) || 0,
          avgDistance: Math.round(Number(userStats.avg_distance)) || 0,
          totalDistance: Math.round(Number(userStats.total_distance)) || 0,
          globalRank: rank,
          lastPlayed: userStats.last_played,
          firstPlayed: userStats.first_played,
          recentGames: recentGames.map(game => ({
            id: game.id,
            score: game.score,
            distance: game.distance,
            mode: game.mode,
            roomId: game.roomId,
            roundIndex: game.roundIndex,
            createdAt: game.createdAt
          }))
        };

      } catch (error) {
        console.error('Error fetching personal stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch personal stats'
        });
      }
    })
});

export type LeaderboardRouter = typeof leaderboardRouter; 