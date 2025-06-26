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
        // Build where clause based on mode filter
        const whereClause = mode === 'all' 
          ? { userId: { not: null } }
          : { userId: { not: null }, mode };

        // Get all guesses with user data, then process in JavaScript
        const guessesWithUsers = await ctx.db.guess.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          },
          orderBy: [
            { score: 'desc' },
            { createdAt: 'desc' }
          ]
        });

        // Group by user and calculate stats
        const userStatsMap = new Map<string, {
          id: string;
          username: string;
          email: string;
          bestScore: number;
          totalGames: number;
          totalScore: number;
          bestDistance: number;
          lastPlayed: Date;
        }>();

        guessesWithUsers.forEach(guess => {
          if (!guess.user) return;
          
          const userId = guess.user.id;
          const existing = userStatsMap.get(userId);
          
          if (!existing) {
            userStatsMap.set(userId, {
              id: guess.user.id,
              username: (guess.user.username || guess.user.email.split('@')[0]) as string,
              email: guess.user.email,
              bestScore: guess.score,
              totalGames: 1,
              totalScore: guess.score,
              bestDistance: guess.distance,
              lastPlayed: guess.createdAt
            });
          } else {
            existing.bestScore = Math.max(existing.bestScore, guess.score);
            existing.totalGames += 1;
            existing.totalScore += guess.score;
            existing.bestDistance = Math.min(existing.bestDistance, guess.distance);
            existing.lastPlayed = guess.createdAt > existing.lastPlayed ? guess.createdAt : existing.lastPlayed;
          }
        });

        // Convert to array and sort by best score
        const topPlayers = Array.from(userStatsMap.values())
          .sort((a, b) => {
            if (b.bestScore !== a.bestScore) {
              return b.bestScore - a.bestScore;
            }
            return (b.totalScore / b.totalGames) - (a.totalScore / a.totalGames);
          })
          .slice(0, limit)
          .map((player, index) => ({
            rank: index + 1,
            id: player.id,
            username: player.username,
            bestScore: player.bestScore,
            totalGames: player.totalGames,
            avgScore: Math.round(player.totalScore / player.totalGames),
            bestDistance: player.bestDistance,
            lastPlayed: player.lastPlayed
          }));

        return topPlayers;

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