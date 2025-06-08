import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/trpc/index.js';

// Create tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// tRPC client configuration
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api/trpc',
      // Add headers, auth, etc. here if needed
      headers() {
        return {
          // Authorization: `Bearer ${token}`, // Will add in Phase 3
        };
      },
    }),
  ],
}); 