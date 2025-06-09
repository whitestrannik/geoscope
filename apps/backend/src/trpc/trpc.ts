import { initTRPC } from '@trpc/server';
import type { Context } from '../lib/auth.js';

// Initialize tRPC with context
const t = initTRPC.context<Context>().create();

// Export reusable pieces
export const router = t.router;
export const publicProcedure = t.procedure; 