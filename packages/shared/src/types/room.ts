import { z } from 'zod';
import { PlayerSchema, Player } from './user.js';
import { GameStateSchema, GameState } from './game.js';

// Room status
export type RoomStatus = 'waiting' | 'active' | 'finished';

// Room schema
export const RoomSchema = z.object({
  id: z.string(),
  code: z.string().length(6),
  name: z.string().min(1).max(50),
  hostId: z.string(),
  status: z.enum(['waiting', 'active', 'finished']),
  maxPlayers: z.number().min(2).max(8).default(4),
  players: z.array(PlayerSchema).default([]),
  game: GameStateSchema.optional(),
  createdAt: z.number(),
  startedAt: z.number().optional(),
  finishedAt: z.number().optional(),
});

export type Room = z.infer<typeof RoomSchema>;

// Room join request schema
export const RoomJoinRequestSchema = z.object({
  roomCode: z.string().length(6),
  userId: z.string(),
  username: z.string(),
});

export type RoomJoinRequest = z.infer<typeof RoomJoinRequestSchema>;

// Room create request schema
export const RoomCreateRequestSchema = z.object({
  name: z.string().min(1).max(50),
  maxPlayers: z.number().min(2).max(8).default(4),
  hostId: z.string(),
  hostUsername: z.string(),
});

export type RoomCreateRequest = z.infer<typeof RoomCreateRequestSchema>; 