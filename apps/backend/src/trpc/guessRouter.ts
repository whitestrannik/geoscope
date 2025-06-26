import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './trpc.js';

// Input validation schemas
const GuessInputSchema = z.object({
  imageId: z.string(),
  imageUrl: z.string().url().optional(), // Add imageUrl for storage
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
  
  // Perfect guess (within 1km) gets max score
  if (distanceKm <= 1) {
    return MAX_SCORE;
  }
  
  // Use same scoring algorithm as multiplayer (socket.ts)
  // Score decreases exponentially with distance
  // Score is 0 at 10000km or more
  const score = MAX_SCORE * Math.exp(-distanceKm / 2000);
  
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
        const result = {
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          score,
          actualLat,
          actualLng,
          guessLat,
          guessLng,
          imageId
        };

        return result;
      } catch (error) {
        console.error('Error evaluating guess:', error);
        throw new Error('Failed to evaluate guess');
      }
    }),

  // New endpoint to store guesses for authenticated users
  submitSoloGuess: protectedProcedure
    .input(GuessInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { imageId, imageUrl, guessLat, guessLng, actualLat, actualLng } = input;
        
        // Calculate distance between guess and actual location
        const distance = calculateDistance(guessLat, guessLng, actualLat, actualLng);
        
        // Calculate score based on distance
        const score = calculateScore(distance);
        
        // Store the guess in the database
        await ctx.db.guess.create({
          data: {
            userId: ctx.user.id,
            imageUrl: imageUrl || `https://images.mapillary.com/${imageId}/thumb-320.jpg`,
            actualLat,
            actualLng,
            guessLat,
            guessLng,
            distance,
            score,
            mode: 'solo',
            roundIndex: 0 // Solo mode is always single round
          }
        });
        
        // Return comprehensive result
        return {
          distance: Math.round(distance * 100) / 100,
          score,
          actualLat,
          actualLng,
          guessLat,
          guessLng,
          imageId
        };
      } catch (error) {
        console.error('Error submitting solo guess:', error);
        throw new Error('Failed to submit guess');
      }
    })
}); 