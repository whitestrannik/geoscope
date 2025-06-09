import { z } from 'zod';
import { router, publicProcedure } from './trpc.js';

// Input validation schemas
const GuessInputSchema = z.object({
  imageId: z.string(),
  guessLat: z.number().min(-90).max(90),
  guessLng: z.number().min(-180).max(180),
  actualLat: z.number().min(-90).max(90),
  actualLng: z.number().min(-180).max(180)
});

const GuessResultSchema = z.object({
  distance: z.number(),
  score: z.number().int().min(0).max(1000),
  actualLat: z.number(),
  actualLng: z.number(),
  guessLat: z.number(),
  guessLng: z.number(),
  imageId: z.string()
});

export type GuessInput = z.infer<typeof GuessInputSchema>;
export type GuessResult = z.infer<typeof GuessResultSchema>;

/**
 * Calculate the great-circle distance between two points using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lng1 Longitude of first point in degrees  
 * @param lat2 Latitude of second point in degrees
 * @param lng2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert degrees to radians
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lng1Rad = (lng1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lng2Rad = (lng2 * Math.PI) / 180;
  
  // Differences
  const deltaLat = lat2Rad - lat1Rad;
  const deltaLng = lng2Rad - lng1Rad;
  
  // Haversine formula
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
           Math.cos(lat1Rad) * Math.cos(lat2Rad) *
           Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Convert distance to score using exponential decay
 * @param distanceKm Distance in kilometers
 * @returns Score from 0 to 1000
 */
export function calculateScore(distanceKm: number): number {
  const MAX_SCORE = 1000;
  const DECAY_FACTOR = 0.0001; // Adjust for scoring curve steepness
  
  // Perfect guess (within 1km) gets max score
  if (distanceKm <= 1) {
    return MAX_SCORE;
  }
  
  // Exponential decay: score = MAX_SCORE * e^(-DECAY_FACTOR * distance)
  const score = MAX_SCORE * Math.exp(-DECAY_FACTOR * distanceKm);
  
  // Ensure minimum score of 1 for any guess, 0 only for very far distances
  return Math.max(0, Math.round(score));
}

export const guessRouter = router({
  evaluate: publicProcedure
    .input(GuessInputSchema)
    .mutation(async ({ input }) => {
      try {
        const { imageId, guessLat, guessLng, actualLat, actualLng } = input;
        
        // Calculate distance between guess and actual location
        const distance = calculateDistance(guessLat, guessLng, actualLat, actualLng);
        
        // Calculate score based on distance
        const score = calculateScore(distance);
        
        // Return comprehensive result
        return {
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          score,
          actualLat,
          actualLng,
          guessLat,
          guessLng,
          imageId
        };
      } catch (error) {
        console.error('Error evaluating guess:', error);
        throw new Error('Failed to evaluate guess');
      }
    })
}); 