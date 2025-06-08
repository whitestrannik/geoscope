import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { imageRouter } from './imageRouter.js';
import { guessRouter } from './guessRouter.js';

// Initialize tRPC
const t = initTRPC.create();

// Export reusable pieces
export const router = t.router;
export const publicProcedure = t.procedure;

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
});

// Export the type definition of the API
export type AppRouter = typeof appRouter; 