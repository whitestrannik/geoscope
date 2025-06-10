import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from './supabase.js';
import { db } from './db.js';

export interface ServerToClientEvents {
  'player-joined': (data: { roomId: string, player: any }) => void;
  'player-left': (data: { roomId: string, playerId: string }) => void;
  'player-ready': (data: { roomId: string, playerId: string, isReady: boolean }) => void;
  'game-started': (data: { roomId: string, imageData: any, roundIndex: number }) => void;
  'round-started': (data: { roomId: string, imageData: any, roundIndex: number, timeLimit?: number }) => void;
  'guess-submitted': (data: { roomId: string, playerId: string, roundIndex: number }) => void;
  'round-ended': (data: { roomId: string, results: any[], roundIndex: number }) => void;
  'game-ended': (data: { roomId: string, finalResults: any[] }) => void;
  'room-updated': (data: { roomId: string, room: any }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'join-room': (data: { roomId: string, token: string }) => void;
  'leave-room': (data: { roomId: string }) => void;
  'player-ready': (data: { roomId: string, isReady: boolean }) => void;
  'submit-guess': (data: { roomId: string, roundIndex: number, guessLat: number, guessLng: number }) => void;
  'start-game': (data: { roomId: string }) => void;
}

export interface InterServerEvents {
  // For future scaling with multiple servers
}

export interface SocketData {
  userId?: string;
  roomId?: string;
}

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

let io: TypedServer;

export function initializeSocket(httpServer: HTTPServer) {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket: TypedSocket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join room
    socket.on('join-room', async ({ roomId, token }) => {
      try {
        // Verify user token
        const user = await verifyToken(token);
        if (!user) {
          socket.emit('error', { message: 'Invalid authentication token' });
          return;
        }

        // Verify user is in room
        const roomPlayer = await db.roomPlayer.findUnique({
          where: {
            roomId_userId: {
              roomId: roomId.toUpperCase(),
              userId: user.id
            }
          },
          include: {
            room: {
              include: {
                host: {
                  select: {
                    id: true,
                    username: true,
                    email: true
                  }
                },
                players: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        username: true,
                        email: true
                      }
                    }
                  }
                }
              }
            },
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        });

        if (!roomPlayer) {
          socket.emit('error', { message: 'You are not in this room' });
          return;
        }

        // Store user data in socket
        socket.data.userId = user.id;
        socket.data.roomId = roomId.toUpperCase();

        // Join socket room
        socket.join(roomId.toUpperCase());

        // Notify other players
        socket.to(roomId.toUpperCase()).emit('player-joined', {
          roomId: roomId.toUpperCase(),
          player: roomPlayer
        });

        // Send current room state to joining player
        socket.emit('room-updated', {
          roomId: roomId.toUpperCase(),
          room: roomPlayer.room
        });

        console.log(`👤 User ${user.id} joined room ${roomId.toUpperCase()}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave-room', async ({ roomId }) => {
      try {
        const userId = socket.data.userId;
        if (!userId) return;

        socket.leave(roomId.toUpperCase());
        
        // Notify other players
        socket.to(roomId.toUpperCase()).emit('player-left', {
          roomId: roomId.toUpperCase(),
          playerId: userId
        });

        // Clear socket data
        socket.data.roomId = undefined;
        console.log(`👤 User ${userId} left room ${roomId.toUpperCase()}`);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });

    // Player ready status
    socket.on('player-ready', async ({ roomId, isReady }) => {
      try {
        const userId = socket.data.userId;
        if (!userId) return;

        // Update database
        await db.roomPlayer.update({
          where: {
            roomId_userId: {
              roomId: roomId.toUpperCase(),
              userId: userId
            }
          },
          data: { isReady }
        });

        // Notify all players in room
        io.to(roomId.toUpperCase()).emit('player-ready', {
          roomId: roomId.toUpperCase(),
          playerId: userId,
          isReady
        });

        console.log(`👤 User ${userId} is ${isReady ? 'ready' : 'not ready'} in room ${roomId.toUpperCase()}`);
      } catch (error) {
        console.error('Error updating ready status:', error);
        socket.emit('error', { message: 'Failed to update ready status' });
      }
    });

    // Start game (host only)
    socket.on('start-game', async ({ roomId }) => {
      try {
        const userId = socket.data.userId;
        if (!userId) return;

        // Verify user is host
        const room = await db.room.findUnique({
          where: { id: roomId.toUpperCase() },
          include: {
            players: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        if (!room || room.hostUserId !== userId) {
          socket.emit('error', { message: 'Only the host can start the game' });
          return;
        }

        // Check if all players are ready
        const allReady = room.players.every(p => p.isReady);
        if (!allReady) {
          socket.emit('error', { message: 'All players must be ready to start' });
          return;
        }

        // Update room status to ACTIVE
        await db.room.update({
          where: { id: roomId.toUpperCase() },
          data: { 
            status: 'ACTIVE',
            currentRound: 1
          }
        });

        // TODO: Get random image for first round
        const imageData = {
          id: 'temp-id',
          imageUrl: 'https://example.com/image.jpg',
          actualLat: 40.7128,
          actualLng: -74.0060
        };

        // Notify all players game has started
        io.to(roomId.toUpperCase()).emit('game-started', {
          roomId: roomId.toUpperCase(),
          imageData,
          roundIndex: 1
        });

        console.log(`🎮 Game started in room ${roomId.toUpperCase()}`);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // Submit guess
    socket.on('submit-guess', async ({ roomId, roundIndex, guessLat, guessLng }) => {
      try {
        const userId = socket.data.userId;
        if (!userId) return;

        // TODO: Validate guess and calculate score
        // For now, just notify that guess was submitted
        
        io.to(roomId.toUpperCase()).emit('guess-submitted', {
          roomId: roomId.toUpperCase(),
          playerId: userId,
          roundIndex
        });

        console.log(`🎯 User ${userId} submitted guess for round ${roundIndex} in room ${roomId.toUpperCase()}`);
      } catch (error) {
        console.error('Error submitting guess:', error);
        socket.emit('error', { message: 'Failed to submit guess' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;
      
      if (userId && roomId) {
        // Notify other players
        socket.to(roomId).emit('player-left', {
          roomId,
          playerId: userId
        });
      }
      
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Helper function to get the socket server instance
export function getSocketServer(): TypedServer {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
}

// Helper functions for emitting events from other parts of the app
export function emitToRoom(roomId: string, event: keyof ServerToClientEvents, data: any) {
  if (io) {
    io.to(roomId.toUpperCase()).emit(event, data);
  }
}

export function emitToUser(userId: string, event: keyof ServerToClientEvents, data: any) {
  if (io) {
    // Find socket by user ID (would need to maintain user-socket mapping)
    // For now, we'll use room-based communication
    console.log(`Attempted to emit to user ${userId}, but user-specific emit not implemented yet`);
  }
} 