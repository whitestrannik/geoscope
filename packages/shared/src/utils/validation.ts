import { z } from 'zod';

// Common validation schemas
export const EmailSchema = z.string().email();
export const UsernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/);
export const RoomCodeSchema = z.string().length(6).regex(/^[A-Z0-9]+$/);

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return EmailSchema.safeParse(email).success;
};

export const validateUsername = (username: string): boolean => {
  return UsernameSchema.safeParse(username).success;
};

export const validateRoomCode = (code: string): boolean => {
  return RoomCodeSchema.safeParse(code).success;
};

export const validateCoordinate = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Generate random room code
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Sanitize username
export const sanitizeUsername = (username: string): string => {
  return username.trim().replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20);
}; 