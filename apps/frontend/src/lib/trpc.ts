import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { supabase } from './supabase';

// Create tRPC React hooks with any type for deployment
export const trpc = createTRPCReact<any>();

// tRPC client configuration
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/trpc`,
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