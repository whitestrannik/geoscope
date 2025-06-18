import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from './supabase';
import { db } from './db';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { appRouter } from '../trpc';

// Create tRPC client for internal use
const trpc = createTRPCProxyClient<typeof appRouter>({
  links: [
    httpBatchLink({
      url: `http://localhost:${process.env.PORT || 3001}/api/trpc`,
    }),
  ],
});

// Helper function to get random image using tRPC client
async function getRandomImage() {
  try {
    const result = await trpc.image.getRandom.query();
    
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
  'results-countdown': (data: { roomId: string, timeRemaining: number }) => void;
  'next-round-ready': (data: { roomId: string, isHost: boolean }) => void;
  'loading-next-round': (data: { roomId: string }) => void;
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
  'start-next-round': (data: { roomId: string }) => void;
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

        // If room is ACTIVE and has an ongoing round, send the current round state
        if (roomPlayer.room.status === 'ACTIVE') {
          const activeRound = activeRounds.get(roomId.toUpperCase());
          if (activeRound) {
            
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
          }
        }
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
      } catch (error) {
        console.error('Error updating ready status:', error);
        socket.emit('error', { message: 'Failed to update ready status' });
      }
    });

    // Start game (host only)
    socket.on('start-game', async ({ roomId }) => {
      try {
        
        const userId = socket.data.userId;
        if (!userId) {
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

    // Start next round (host only, for manual mode)
    socket.on('start-next-round', async ({ roomId }) => {
      try {
        const userId = socket.data.userId;
        if (!userId) {
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

        if (!room || room.hostUserId !== userId) {
          socket.emit('error', { message: 'Only the host can start the next round' });
          return;
        }

        // Check if room is in correct state for next round
        if (room.status !== 'ACTIVE') {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }

        // Check if we haven't exceeded total rounds
        if (room.currentRound >= room.totalRounds) {
          socket.emit('error', { message: 'Game has already ended' });
          return;
        }

        // Emit loading state
        io.to(roomId.toUpperCase()).emit('loading-next-round', {
          roomId: roomId.toUpperCase()
        });

        // Start the next round
        const nextRoundIndex = room.currentRound + 1;
        
        // Update room's current round
        await db.room.update({
          where: { id: roomId.toUpperCase() },
          data: { currentRound: nextRoundIndex }
        });

        // Start the new round
        await startNewRound(roomId.toUpperCase(), nextRoundIndex, room.roundTimeLimit ?? undefined);

      } catch (error) {
        console.error('❌ Error starting next round:', error);
        socket.emit('error', { message: 'Failed to start next round' });
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
      

    });
  });

  return io;
}

// Helper function to start a new round
async function startNewRound(roomId: string, roundIndex: number, timeLimit?: number) {
  try {
    
    // Get random image
    const imageData = await getRandomImage();
    
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
    
    io.to(roomId).emit('round-started', eventData);

    // Set timeout to end round if time limit is set
    if (timeLimit) {
      setTimeout(async () => {
        const currentRound = activeRounds.get(roomId);
        if (currentRound && currentRound.roundIndex === roundIndex) {
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
      return;
    }
    
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

      // Store the guess in database and update player's total score
      Promise.all([
        // Store individual guess record
        db.guess.create({
          data: {
            userId: player.userId,
            roomId: roomId,
            imageUrl: roundState.imageData.imageUrl,
            actualLat: roundState.imageData.actualLat,
            actualLng: roundState.imageData.actualLng,
            guessLat: guess.guessLat,
            guessLng: guess.guessLng,
            distance: distance,
            score: score,
            mode: 'multiplayer',
            roundIndex: roundState.roundIndex
          }
        }),
        // Update player's total score
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
        })
      ]).catch(error => {
        console.error('Error storing guess and updating score:', error);
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
      // Handle next round based on room's autoAdvance setting
      if (room.autoAdvance) {
        // Auto mode: Start countdown timer
        const resultsDisplayTime = room.resultsDisplayTime || 20; // Default 20 seconds
        let timeRemaining = resultsDisplayTime;
        
        const countdownInterval = setInterval(() => {
          timeRemaining--;
          
          // Emit countdown update
          io.to(roomId).emit('results-countdown', {
            roomId,
            timeRemaining
          });
          
          if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            
            // Emit loading state
            io.to(roomId).emit('loading-next-round', {
              roomId
            });
            
            // Start next round after a short delay for loading state
            setTimeout(async () => {
              const nextRoundIndex = roundState.roundIndex + 1;
              
              // Update room's current round
              await db.room.update({
                where: { id: roomId },
                data: { currentRound: nextRoundIndex }
              });
              
              await startNewRound(roomId, nextRoundIndex, room.roundTimeLimit ?? undefined);
            }, 2000); // 2 second loading delay
          }
        }, 1000);
        
      } else {
        // Manual mode: Keep players in results view until host advances
        // Do NOT emit next-round-ready yet - let them examine results
        // The next-round-ready will be handled when host clicks the button
      }
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

export function emitToUser(_userId: string, _event: keyof ServerToClientEvents, _data: any) {
  if (io) {
    // Find socket by user ID (would need to maintain user-socket mapping)
    // For now, we'll use room-based communication
  }
} 