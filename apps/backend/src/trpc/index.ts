import { z } from 'zod';
import { router, publicProcedure } from './trpc.js';
import { imageRouter } from './imageRouter.js';
import { guessRouter } from './guessRouter.js';
import { userRouter } from './user.js';
import { roomRouter } from './roomRouter.js';
import { leaderboardRouter } from './leaderboardRouter.js';

// Define main app router
export const appRouter = router({
  // Health check endpoint
  health: publicProcedure
    .query(() => {
      return {
        status: 'ok',
        message: 'GeoScope tRPC API is running!',
        timestamp: new Date().toISOString(),
      };
    }),

  // Test procedure with input validation
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        greeting: `Hello, ${input.name || 'Anonymous'}!`,
        from: 'GeoScope Backend',
      };
    }),

  // Phase 2 routers
  image: imageRouter,
  guess: guessRouter,
  
  // Phase 3 routers
  user: userRouter,
  
  // Phase 4 routers
  room: roomRouter,

  // Phase 5 routers
  leaderboard: leaderboardRouter,
});

// Export the app router type for frontend usage
export type AppRouter = typeof appRouter; 