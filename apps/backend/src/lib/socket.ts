import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from './supabase';
import { db } from './db';
import { imageRouter } from '../trpc/imageRouter';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { appRouter } from '../trpc';

// Create tRPC client for internal use
console.log('🔧 Initializing tRPC client...');
const trpc = createTRPCProxyClient<typeof appRouter>({
  links: [
    httpBatchLink({
      url: `http://localhost:${process.env.PORT || 3001}/api/trpc`,
    }),
  ],
});
console.log('✅ tRPC client initialized');

// Helper function to get random image using tRPC client
async function getRandomImage() {
  try {
    console.log('🖼️ Requesting random image from tRPC...');
    const result = await trpc.image.getRandom.query();
    console.log('📥 Received tRPC response:', result);
    
    if (!result) {
      console.error('❌ No image data received from tRPC');
      throw new Error('No image data received from tRPC');
    }

    const imageData = {
      id: result.id,
      imageUrl: result.imageUrl,
      actualLat: result.actualLat,
      actualLng: result.actualLng,
      location: result.location,
      copyright: result.copyright
    };
    console.log('✅ Processed image data:', imageData);
    return imageData;
  } catch (error) {
    console.error('❌ Error getting random image:', error instanceof Error ? error.message : String(error));
    console.error('❌ Full error:', error);
    throw error;
  }
}

// Game state management
interface RoundState {
  roomId: string;
  roundIndex: number;
  imageData: {
    imageUrl: string;
    actualLat: number;
    actualLng: number;
  };
  guesses: Map<string, { guessLat: number; guessLng: number; timestamp: number }>;
  startTime: number;
  timeLimit: number | undefined;
}

const activeRounds = new Map<string, RoundState>();

export interface ServerToClientEvents {
  'player-joined': (data: { roomId: string, player: any }) => void;
  'player-left': (data: { roomId: string, playerId: string }) => void;
  'player-ready': (data: { roomId: string, playerId: string, isReady: boolean }) => void;
  'game-started': (data: { roomId: string, roundIndex: number }) => void;
  'round-started': (data: { 
    roomId: string, 
    imageData: { imageUrl: string }, 
    roundIndex: number, 
    timeLimit?: number 
  }) => void;
  'guess-submitted': (data: { roomId: string, playerId: string, roundIndex: number }) => void;
  'round-ended': (data: { 
    roomId: string, 
    results: Array<{
      playerId: string,
      username: string,
      guessLat: number,
      guessLng: number,
      distance: number,
      score: number,
      totalScore: number,
      hasGuessed: boolean
    }>, 
    roundIndex: number,
    actualLocation: { lat: number, lng: number },
    imageUrl: string
  }) => void;
  'game-ended': (data: { 
    roomId: string, 
    finalResults: Array<{
      playerId: string,
      username: string,
      totalScore: number
    }>
  }) => void;
  'room-updated': (data: { roomId: string, room: any }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'join-room': (data: { roomId: string, token: string }) => void;
  'leave-room': (data: { roomId: string }) => void;
  'player-ready': (data: { roomId: string, isReady: boolean }) => void;
  'submit-guess': (data: { roomId: string, roundIndex: number, guessLat: number, guessLng: number }) => void;
  'start-game': (data: { roomId: string }) => void;
  'get-round-state': (data: { roomId: string }) => void;
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
    console.log(`🔌 Socket transport: ${socket.conn.transport.name}`);
    console.log(`🔌 Socket handshake: ${JSON.stringify(socket.handshake.headers.origin)}`);

    // Join room
    console.log('🏠 Backend: Registering join-room event listener');
    socket.on('join-room', async ({ roomId, token }) => {
      console.log('🏠 Backend: join-room event received!', { roomId });
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

        // If room is ACTIVE and has an ongoing round, send the current round state
        if (roomPlayer.room.status === 'ACTIVE') {
          const activeRound = activeRounds.get(roomId.toUpperCase());
          if (activeRound) {
            console.log(`🎯 Room ${roomId.toUpperCase()} is ACTIVE with ongoing round ${activeRound.roundIndex} - sending round state to joining player`);
            
            // Calculate remaining time if there's a time limit
            let timeRemaining: number | undefined;
            if (activeRound.timeLimit) {
              const elapsed = Math.floor((Date.now() - activeRound.startTime) / 1000);
              timeRemaining = Math.max(0, activeRound.timeLimit - elapsed);
            }
            
            // Send round-started event to the joining player
            socket.emit('round-started', {
              roomId: roomId.toUpperCase(),
              imageData: {
                imageUrl: activeRound.imageData.imageUrl
              },
              roundIndex: activeRound.roundIndex,
              ...(timeRemaining !== undefined && { timeLimit: timeRemaining })
            });
            
            console.log(`🎯 Sent round-started event to joining player ${user.id} for round ${activeRound.roundIndex}`);
          }
        }

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
        delete socket.data.roomId;
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
    console.log('🎮 Backend: Registering start-game event listener');
    socket.on('start-game', async ({ roomId }) => {
      console.log('🎮 Backend: start-game event received!', { roomId });
      try {
        console.log(`🎮 Start game request received for room ${roomId} from user ${socket.data.userId}`);
        
        const userId = socket.data.userId;
        if (!userId) {
          console.log('❌ No userId in socket data');
          return;
        }

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

        console.log(`🏠 Room found: ${room?.id}, Host: ${room?.hostUserId}, Current user: ${userId}`);

        if (!room || room.hostUserId !== userId) {
          console.log('❌ User is not the host');
          socket.emit('error', { message: 'Only the host can start the game' });
          return;
        }

        // Check if all players are ready
        const allReady = room.players.every(p => p.isReady);
        console.log(`👥 Players ready status:`, room.players.map(p => ({ id: p.userId, ready: p.isReady })));
        
        if (!allReady) {
          console.log('❌ Not all players are ready');
          socket.emit('error', { message: 'All players must be ready to start' });
          return;
        }

        console.log('✅ All checks passed, updating room status and starting first round');

        // Update room status to ACTIVE and start first round
        await db.room.update({
          where: { id: roomId.toUpperCase() },
          data: { 
            status: 'ACTIVE',
            currentRound: 1
          }
        });

        // Emit game-started event to all players
        io.to(roomId.toUpperCase()).emit('game-started', {
          roomId: roomId.toUpperCase(),
          roundIndex: 1
        });

        // Start the first round
        await startNewRound(roomId.toUpperCase(), 1, room.roundTimeLimit ?? undefined);

      } catch (error) {
        console.error('❌ Error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // Get current round state (for players joining active games)
    socket.on('get-round-state', async ({ roomId }) => {
      try {
        const userId = socket.data.userId;
        if (!userId) return;

        const roomIdUpper = roomId.toUpperCase();
        const activeRound = activeRounds.get(roomIdUpper);
        
        if (activeRound) {
          console.log(`🎯 Player ${userId} requested round state for room ${roomIdUpper} - sending round ${activeRound.roundIndex}`);
          
          // Calculate remaining time if there's a time limit
          let timeRemaining: number | undefined;
          if (activeRound.timeLimit) {
            const elapsed = Math.floor((Date.now() - activeRound.startTime) / 1000);
            timeRemaining = Math.max(0, activeRound.timeLimit - elapsed);
          }
          
          // Send round-started event to the requesting player
          socket.emit('round-started', {
            roomId: roomIdUpper,
            imageData: {
              imageUrl: activeRound.imageData.imageUrl
            },
            roundIndex: activeRound.roundIndex,
            ...(timeRemaining !== undefined && { timeLimit: timeRemaining })
          });
          
          console.log(`🎯 Sent round-started event to player ${userId} for round ${activeRound.roundIndex}`);
        } else {
          console.log(`🎯 Player ${userId} requested round state for room ${roomIdUpper} but no active round found`);
        }
      } catch (error) {
        console.error('Error getting round state:', error);
        socket.emit('error', { message: 'Failed to get round state' });
      }
    });

    // Submit guess
    socket.on('submit-guess', async ({ roomId, roundIndex, guessLat, guessLng }) => {
      try {
        const userId = socket.data.userId;
        if (!userId) return;

        const roomIdUpper = roomId.toUpperCase();
        const roundState = activeRounds.get(roomIdUpper);
        
        if (!roundState || roundState.roundIndex !== roundIndex) {
          socket.emit('error', { message: 'Round not active or index mismatch' });
          return;
        }

        // Check if time limit exceeded
        if (roundState.timeLimit) {
          const elapsed = Date.now() - roundState.startTime;
          if (elapsed > roundState.timeLimit * 1000) {
            socket.emit('error', { message: 'Time limit exceeded' });
            return;
          }
        }

        // Store the guess
        roundState.guesses.set(userId, {
          guessLat,
          guessLng,
          timestamp: Date.now()
        });

        // Notify all players that a guess was submitted
        io.to(roomIdUpper).emit('guess-submitted', {
          roomId: roomIdUpper,
          playerId: userId,
          roundIndex
        });

        console.log(`🎯 User ${userId} submitted guess for round ${roundIndex} in room ${roomIdUpper}`);

        // Check if all players have submitted guesses
        const room = await db.room.findUnique({
          where: { id: roomIdUpper },
          include: { players: true }
        });

        if (room && roundState.guesses.size >= room.players.length) {
          // All players have submitted - end the round
          await endRound(roomIdUpper);
        }

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

// Helper function to start a new round
async function startNewRound(roomId: string, roundIndex: number, timeLimit?: number) {
  try {
    console.log(`🎯 Starting new round ${roundIndex} for room ${roomId} with timeLimit: ${timeLimit}`);
    
    // Get random image
    console.log('🖼️ Requesting random image...');
    const imageData = await getRandomImage();
    console.log(`🖼️ Got image data:`, { 
      id: imageData.id, 
      url: imageData.imageUrl,
      lat: imageData.actualLat,
      lng: imageData.actualLng
    });
    
    // Create round state
    const roundState: RoundState = {
      roomId,
      roundIndex,
      imageData: {
        imageUrl: imageData.imageUrl,
        actualLat: imageData.actualLat,
        actualLng: imageData.actualLng
      },
      guesses: new Map(),
      startTime: Date.now(),
      timeLimit: timeLimit
    };

    activeRounds.set(roomId, roundState);
    console.log(`💾 Round state saved for room ${roomId}`);

    // Notify all players that the round has started
    const eventData = {
      roomId,
      imageData: {
        imageUrl: imageData.imageUrl,
        // Don't send actual coordinates to clients
      },
      roundIndex,
      ...(timeLimit !== undefined && { timeLimit })
    };
    
    console.log(`📡 Emitting round-started event to room ${roomId}:`, eventData);
    io.to(roomId).emit('round-started', eventData);

    console.log(`🎮 Round ${roundIndex} started in room ${roomId}`);

    // Set timeout to end round if time limit is set
    if (timeLimit) {
      setTimeout(async () => {
        const currentRound = activeRounds.get(roomId);
        if (currentRound && currentRound.roundIndex === roundIndex) {
          console.log(`⏰ Time limit reached for round ${roundIndex} in room ${roomId}`);
          await endRound(roomId);
        }
      }, timeLimit * 1000);
    }

  } catch (error) {
    console.error('❌ Error starting new round:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error details:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    io.to(roomId).emit('error', { message: 'Failed to start round' });
  }
}

// Helper function to end a round and calculate scores
async function endRound(roomId: string) {
  try {
    const roundState = activeRounds.get(roomId);
    if (!roundState) {
      console.log(`❌ No active round found for room ${roomId}`);
      return;
    }

    console.log(`🎯 Ending round ${roundState.roundIndex} for room ${roomId}`);
    
    // Get all players in the room
    const room = await db.room.findUnique({
      where: { id: roomId },
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

    if (!room) {
      console.log(`❌ Room ${roomId} not found`);
      return;
    }

    // Calculate scores for each player
    const results = room.players.map((player: { 
      userId: string; 
      score: number; 
      user: { 
        username: string | null; 
        email: string; 
      }; 
    }) => {
      const guess = roundState.guesses.get(player.userId);
      // Ensure username is always a string
      const username = (player.user.username || player.user.email.split('@')[0]) as string;
      
      if (!guess) {
        return {
          playerId: player.userId,
          username,
          guessLat: 0,
          guessLng: 0,
          distance: 0,
          score: 0,
          totalScore: player.score,
          hasGuessed: false
        };
      }

      // Calculate distance using haversine formula
      const distance = calculateHaversineDistance(
        guess.guessLat,
        guess.guessLng,
        roundState.imageData.actualLat,
        roundState.imageData.actualLng
      );

      // Calculate score based on distance
      const score = calculateRoundScore(distance);
      const newTotalScore = player.score + score;

      // Update player's total score in database
      db.roomPlayer.update({
        where: {
          roomId_userId: {
            roomId,
            userId: player.userId
          }
        },
        data: {
          score: newTotalScore
        }
      });

      return {
        playerId: player.userId,
        username,
        guessLat: guess.guessLat,
        guessLng: guess.guessLng,
        distance,
        score,
        totalScore: newTotalScore,
        hasGuessed: true
      };
    });

    // Sort results by score with proper type annotations
    results.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    // Broadcast round results
    io.to(roomId).emit('round-ended', {
      roomId,
      results,
      roundIndex: roundState.roundIndex,
      actualLocation: {
        lat: roundState.imageData.actualLat,
        lng: roundState.imageData.actualLng
      },
      imageUrl: roundState.imageData.imageUrl
    });

    // Check if this was the last round
    if (roundState.roundIndex >= room.totalRounds) {
      // End the game
      await endGame(roomId, results);
    } else {
      // Start next round after a short delay
      setTimeout(() => {
        startNewRound(roomId, roundState.roundIndex + 1, room.roundTimeLimit ?? undefined);
      }, 5000); // 5 second delay between rounds
    }

    // Clean up round state
    activeRounds.delete(roomId);

  } catch (error) {
    console.error('❌ Error ending round:', error);
    io.to(roomId).emit('error', { message: 'Failed to end round' });
  }
}

// Helper function to calculate distance between two points
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to convert degrees to radians
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Helper function to calculate score based on distance
function calculateRoundScore(distance: number): number {
  // Score decreases exponentially with distance
  // Max score is 1000 points
  // Score is 0 at 10000km or more
  return Math.max(0, Math.round(1000 * Math.exp(-distance / 2000)));
}

// Helper function to end the game
async function endGame(roomId: string, finalResults: any[]) {
  try {
    // Update room status to FINISHED
    await db.room.update({
      where: { id: roomId },
      data: { status: 'FINISHED' }
    });

    // Calculate final rankings based on total scores
    const sortedResults = finalResults.sort((a, b) => b.totalScore - a.totalScore);

    // Broadcast game end
    io.to(roomId).emit('game-ended', {
      roomId,
      finalResults: sortedResults
    });

    console.log(`🎉 Game ended in room ${roomId}`);

    // Clean up any remaining round state
    activeRounds.delete(roomId);

  } catch (error) {
    console.error('Error ending game:', error);
    io.to(roomId).emit('error', { message: 'Failed to end game' });
  }
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