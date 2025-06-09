import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/trpc/index.js';
import { supabase } from './supabase';

// Create tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// tRPC client configuration
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api/trpc',
      async headers() {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        
        return {
          ...(token && { Authorization: `Bearer ${token}` }),
        };
      },
    }),
  ],
}); 