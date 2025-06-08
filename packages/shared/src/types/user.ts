import { z } from 'zod';

// User schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().min(3).max(20),
  avatar: z.string().url().optional(),
  createdAt: z.number(),
  lastActiveAt: z.number(),
});

export type User = z.infer<typeof UserSchema>;

// Player schema (user in game context)
export const PlayerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  avatar: z.string().url().optional(),
  score: z.number().default(0),
  isReady: z.boolean().default(false),
  isHost: z.boolean().default(false),
  joinedAt: z.number(),
});

export type Player = z.infer<typeof PlayerSchema>;

// Player stats schema
export const PlayerStatsSchema = z.object({
  userId: z.string(),
  gamesPlayed: z.number().default(0),
  totalScore: z.number().default(0),
  averageScore: z.number().default(0),
  bestScore: z.number().default(0),
  averageDistance: z.number().default(0),
  bestDistance: z.number().default(0),
});

export type PlayerStats = z.infer<typeof PlayerStatsSchema>; 