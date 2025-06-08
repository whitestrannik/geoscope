import { describe, it, expect } from 'vitest';
import { calculateDistance, calculateScore } from './guessRouter.js';

describe('Distance Calculation', () => {
  it('calculates distance between same coordinates as 0', () => {
    const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
    expect(distance).toBe(0);
  });

  it('calculates distance between New York and London correctly', () => {
    // NYC coordinates
    const nyLat = 40.7128;
    const nyLng = -74.0060;
    
    // London coordinates
    const londonLat = 51.5074;
    const londonLng = -0.1278;
    
    const distance = calculateDistance(nyLat, nyLng, londonLat, londonLng);
    
    // Expected distance is approximately 5570 km
    expect(distance).toBeCloseTo(5570, 0); // Within 1 km tolerance
  });

  it('calculates distance between Sydney and Tokyo correctly', () => {
    // Sydney coordinates
    const sydneyLat = -33.8688;
    const sydneyLng = 151.2093;
    
    // Tokyo coordinates
    const tokyoLat = 35.6762;
    const tokyoLng = 139.6503;
    
    const distance = calculateDistance(sydneyLat, sydneyLng, tokyoLat, tokyoLng);
    
    // Expected distance is approximately 7825.82 km
    expect(distance).toBeCloseTo(7825.82, 0.5); // Within 0.5 km tolerance
  });

  it('handles crossing the international date line', () => {
    // Points on either side of the date line
    const point1Lat = 0;
    const point1Lng = 179;
    const point2Lat = 0;
    const point2Lng = -179;
    
    const distance = calculateDistance(point1Lat, point1Lng, point2Lat, point2Lng);
    
    // Should be approximately 222.39 km (shortest distance across date line)
    expect(distance).toBeCloseTo(222.39, 0.5);
  });
});

describe('Score Calculation', () => {
  it('gives maximum score for perfect guess (0 km)', () => {
    const score = calculateScore(0);
    expect(score).toBe(1000);
  });

  it('gives maximum score for very close guess (within 1 km)', () => {
    const score = calculateScore(0.5);
    expect(score).toBe(1000);
  });

  it('decreases score as distance increases', () => {
    const score10 = calculateScore(10);
    const score100 = calculateScore(100);
    const score1000 = calculateScore(1000);
    
    expect(score10).toBeGreaterThan(score100);
    expect(score100).toBeGreaterThan(score1000);
  });

  it('gives reasonable scores for typical distances', () => {
    // Score for 100 km away (within same country/region)
    const score100 = calculateScore(100);
    expect(score100).toBeGreaterThan(900);
    expect(score100).toBeLessThan(1000);
    
    // Score for 1000 km away (different country)
    const score1000 = calculateScore(1000);
    expect(score1000).toBeGreaterThan(350);
    expect(score1000).toBeLessThan(950);
    
    // Score for 5000 km away (different continent)  
    const score5000 = calculateScore(5000);
    expect(score5000).toBeGreaterThan(0);
    expect(score5000).toBeLessThan(700);
  });

  it('never gives negative scores', () => {
    const veryFarScore = calculateScore(20000); // Antipodes distance
    expect(veryFarScore).toBeGreaterThanOrEqual(0);
  });

  it('returns integer scores', () => {
    const score = calculateScore(500);
    expect(score).toBe(Math.floor(score));
  });

  it('returns scores within valid range', () => {
    const distances = [0, 1, 10, 100, 1000, 5000, 10000, 20000];
    
    distances.forEach(distance => {
      const score = calculateScore(distance);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1000);
    });
  });
});

