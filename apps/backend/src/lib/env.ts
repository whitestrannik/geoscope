import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from external .env file
dotenv.config({ 
  path: path.join(process.cwd(), '../../../.env/geoscope.env') 
});

// Define environment schema
const envSchema = z.object({
  // Database (skip validation for now)
  DATABASE_URL: z.string().optional(),
  
  // Supabase
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // External APIs
  MAPILLARY_ACCESS_TOKEN: z.string().optional(),
  
  // Server config
  PORT: z.string().transform(Number).default('8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

// Validate and export environment variables
export const env = envSchema.parse(process.env);

// Type for environment variables
export type Env = z.infer<typeof envSchema>; 