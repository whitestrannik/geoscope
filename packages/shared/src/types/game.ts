import { z } from 'zod';

// Game modes
export type GameMode = 'solo' | 'multiplayer';

// Game status
export type GameStatus = 'waiting' | 'active' | 'finished';

// Round status
export type RoundStatus = 'waiting' | 'active' | 'guessing' | 'results' | 'finished';

// Coordinate schema
export const CoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type Coordinate = z.infer<typeof CoordinateSchema>;

// Image data schema
export const ImageDataSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  location: CoordinateSchema,
  source: z.string().optional(),
  attribution: z.string().optional(),
});

export type ImageData = z.infer<typeof ImageDataSchema>;

// Player guess schema
export const PlayerGuessSchema = z.object({
  playerId: z.string(),
  coordinate: CoordinateSchema,
  timestamp: z.number(),
  distanceKm: z.number().optional(),
  score: z.number().optional(),
});

export type PlayerGuess = z.infer<typeof PlayerGuessSchema>;

// Round data schema
export const RoundDataSchema = z.object({
  id: z.string(),
  roundNumber: z.number().min(1),
  image: ImageDataSchema,
  status: z.enum(['waiting', 'active', 'guessing', 'results', 'finished']),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  timeLimit: z.number().default(60), // seconds
  guesses: z.array(PlayerGuessSchema).default([]),
});

export type RoundData = z.infer<typeof RoundDataSchema>;

// Game settings schema
export const GameSettingsSchema = z.object({
  maxRounds: z.number().min(1).max(10).default(5),
  timeLimit: z.number().min(10).max(300).default(60), // seconds
  allowMovement: z.boolean().default(true),
  allowZoom: z.boolean().default(true),
  showCountry: z.boolean().default(false),
});

export type GameSettings = z.infer<typeof GameSettingsSchema>;

// Game state schema
export const GameStateSchema = z.object({
  id: z.string(),
  mode: z.enum(['solo', 'multiplayer']),
  status: z.enum(['waiting', 'active', 'finished']),
  settings: GameSettingsSchema,
  currentRound: z.number().default(0),
  rounds: z.array(RoundDataSchema).default([]),
  createdAt: z.number(),
  startedAt: z.number().optional(),
  finishedAt: z.number().optional(),
});

export type GameState = z.infer<typeof GameStateSchema>; 