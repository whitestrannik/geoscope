import { initTRPC } from '@trpc/server';
import { z } from 'zod';

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
});

// Export the type definition of the API
export type AppRouter = typeof appRouter; 