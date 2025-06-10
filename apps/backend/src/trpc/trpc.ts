import { initTRPC } from '@trpc/server';
import { requireAuth } from '../lib/auth.js';
import type { Context } from '../lib/auth.js';

// Initialize tRPC with context
const t = initTRPC.context<Context>().create();

// Base procedure (public)
const publicProcedure = t.procedure;

// Protected procedure (requires authentication)
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const user = requireAuth(ctx);
  return next({
    ctx: {
      ...ctx,
      user, // Now guaranteed to be non-null
    },
  });
});

// Export reusable pieces
export const router = t.router;
export { publicProcedure, protectedProcedure }; 