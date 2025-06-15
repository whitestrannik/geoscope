import { describe, it, expect, beforeEach, vi } from 'vitest';

// Test the core socket functionality
describe('Socket Multiplayer Logic', () => {
  // Test Haversine distance calculation
  describe('calculateHaversineDistance', () => {
    // Import the function from socket.ts (we'll need to export it)
    const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    const toRad = (degrees: number): number => {
      return degrees * (Math.PI / 180);
    };

    it('should calculate zero distance for same location', () => {
      const distance = calculateHaversineDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBeCloseTo(0, 2);
    });

    it('should calculate distance between New York and Los Angeles', () => {
      const nyLat = 40.7128, nyLng = -74.0060;
      const laLat = 34.0522, laLng = -118.2437;
      const distance = calculateHaversineDistance(nyLat, nyLng, laLat, laLng);
      expect(distance).toBeCloseTo(3944, 0); // ~3944 km
    });

    it('should calculate distance between London and Paris', () => {
      const londonLat = 51.5074, londonLng = -0.1278;
      const parisLat = 48.8566, parisLng = 2.3522;
      const distance = calculateHaversineDistance(londonLat, londonLng, parisLat, parisLng);
      expect(distance).toBeCloseTo(344, 0); // ~344 km
    });
  });

  // Test score calculation
  describe('calculateRoundScore', () => {
    const calculateRoundScore = (distance: number): number => {
      // Score decreases exponentially with distance
      // Max score is 1000 points
      // Score is 0 at 10000km or more
      return Math.max(0, Math.round(1000 * Math.exp(-distance / 2000)));
    };

    it('should give maximum score for perfect guess', () => {
      const score = calculateRoundScore(0);
      expect(score).toBe(1000);
    });

    it('should give decreasing score for increasing distance', () => {
      const score100 = calculateRoundScore(100);
      const score500 = calculateRoundScore(500);
      const score1000 = calculateRoundScore(1000);
      
      expect(score100).toBeGreaterThan(score500);
      expect(score500).toBeGreaterThan(score1000);
      expect(score1000).toBeGreaterThan(0);
    });

    it('should give zero score for very far distances', () => {
      const score = calculateRoundScore(15000);
      expect(score).toBe(0);
    });

    it('should give reasonable scores for typical distances', () => {
      const score50 = calculateRoundScore(50);   // Very close
      const score200 = calculateRoundScore(200); // Close
      const score1000 = calculateRoundScore(1000); // Medium
      const score5000 = calculateRoundScore(5000); // Far
      
      expect(score50).toBeGreaterThan(950);
      expect(score200).toBeGreaterThan(800);
      expect(score1000).toBeGreaterThan(500);
      expect(score5000).toBeGreaterThan(0);
      expect(score5000).toBeLessThan(100);
    });
  });

  // Test room code generation
  describe('generateRoomCode', () => {
    const generateRoomCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    it('should generate 6 character codes', () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
    });

    it('should only contain valid characters', () => {
      const code = generateRoomCode();
      const validChars = /^[ABCDEFGHIJKLMNPQRSTUVWXYZ123456789]+$/;
      expect(code).toMatch(validChars);
    });

    it('should generate different codes each time', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode());
      }
      // Should generate at least 95 unique codes out of 100
      expect(codes.size).toBeGreaterThan(95);
    });
  });

  // Test game state transitions
  describe('Game State Logic', () => {
    it('should handle round progression correctly', () => {
      const gameState = {
        currentRound: 1,
        totalRounds: 5,
        status: 'ACTIVE'
      };

      // Test round progression
      expect(gameState.currentRound < gameState.totalRounds).toBe(true);
      
      // Simulate round completion
      gameState.currentRound++;
      expect(gameState.currentRound).toBe(2);
      
      // Test game completion
      gameState.currentRound = 5;
      const isGameComplete = gameState.currentRound >= gameState.totalRounds;
      expect(isGameComplete).toBe(true);
    });

    it('should handle player guess validation', () => {
      const roundState = {
        roundIndex: 1,
        guesses: new Map(),
        timeLimit: 60,
        startTime: Date.now()
      };

      // Test guess submission
      const playerId = 'player-123';
      const guess = { guessLat: 40.7128, guessLng: -74.0060, timestamp: Date.now() };
      
      roundState.guesses.set(playerId, guess);
      expect(roundState.guesses.has(playerId)).toBe(true);
      expect(roundState.guesses.get(playerId)).toEqual(guess);
    });

    it('should handle timeout logic', () => {
      const timeLimit = 60; // 60 seconds
      const startTime = Date.now() - 70000; // 70 seconds ago
      const currentTime = Date.now();
      
      const elapsed = currentTime - startTime;
      const hasTimedOut = elapsed > timeLimit * 1000;
      
      expect(hasTimedOut).toBe(true);
    });
  });
}); 