import { z } from 'zod';
import { router, protectedProcedure } from './trpc.js';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const CreateRoomInputSchema = z.object({
  maxPlayers: z.number().int().min(2).max(10).default(6),
  totalRounds: z.number().int().min(1).max(20).default(5),
  roundTimeLimit: z.number().int().min(30).max(300).optional(), // 30 sec to 5 min
  autoAdvance: z.boolean().default(true), // true = auto timer, false = manual host control
  resultsDisplayTime: z.number().int().min(5).max(60).default(20), // 5-60 seconds to show results
});

const JoinRoomInputSchema = z.object({
  roomId: z.string().min(1),
});

const UpdateRoomStatusSchema = z.object({
  roomId: z.string().min(1),
  status: z.enum(['WAITING', 'ACTIVE', 'FINISHED']),
});

const SetPlayerReadySchema = z.object({
  roomId: z.string().min(1),
  isReady: z.boolean(),
});

export type CreateRoomInput = z.infer<typeof CreateRoomInputSchema>;
export type JoinRoomInput = z.infer<typeof JoinRoomInputSchema>;

/**
 * Generate a unique 6-character room code
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Exclude confusing chars
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const roomRouter = router({
  // Create a new multiplayer room
  create: protectedProcedure
    .input(CreateRoomInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      let roomCode = '';
      let attempts = 0;
      const maxAttempts = 10;

      // Generate unique room code
      while (attempts < maxAttempts) {
        roomCode = generateRoomCode();
        const existing = await ctx.db.room.findUnique({
          where: { id: roomCode }
        });
        
        if (!existing) break;
        attempts++;
      }

      if (attempts === maxAttempts) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate unique room code'
        });
      }

      // Create room and add host as first player
      const room = await ctx.db.room.create({
        data: {
          id: roomCode,
          hostUserId: userId,
          maxPlayers: input.maxPlayers,
          totalRounds: input.totalRounds,
          roundTimeLimit: input.roundTimeLimit ?? null,
          autoAdvance: input.autoAdvance,
          resultsDisplayTime: input.resultsDisplayTime,
          players: {
            create: {
              userId: userId,
              score: 0,
              isReady: true // Host is always ready
            }
          }
        },
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
      });

      return {
        id: room.id,
        hostUserId: room.hostUserId,
        status: room.status,
        maxPlayers: room.maxPlayers,
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
        roundTimeLimit: room.roundTimeLimit,
        autoAdvance: room.autoAdvance,
        resultsDisplayTime: room.resultsDisplayTime,
        createdAt: room.createdAt,
        host: room.host,
        players: room.players.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          joinedAt: p.joinedAt,
          score: p.score,
          isReady: p.isReady,
          user: p.user
        }))
      };
    }),

  // Join an existing room
  join: protectedProcedure
    .input(JoinRoomInputSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const roomId = input.roomId.toUpperCase(); // Room codes are uppercase

      // Find room
      const room = await ctx.db.room.findUnique({
        where: { id: roomId },
        include: {
          players: true
        }
      });

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Room not found'
        });
      }

      // Check if room is available
      if (room.status !== 'WAITING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Room is not accepting new players'
        });
      }

      // Check if room is full
      if (room.players.length >= room.maxPlayers) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Room is full'
        });
      }

      // Check if user is already in room
      const existingPlayer = room.players.find((p: any) => p.userId === userId);
      if (existingPlayer) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are already in this room'
        });
      }

      // Add player to room
      await ctx.db.roomPlayer.create({
        data: {
          roomId: roomId,
          userId: userId,
          score: 0,
          isReady: false
        }
      });

      // Return updated room data
      const updatedRoom = await ctx.db.room.findUnique({
        where: { id: roomId },
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
      });

      return updatedRoom;
    }),

  // Get room details
  get: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ input, ctx }) => {
      const roomId = input.roomId.toUpperCase();
      
      const room = await ctx.db.room.findUnique({
        where: { id: roomId },
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
            },
            orderBy: {
              joinedAt: 'asc'
            }
          }
        }
      });

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Room not found'
        });
      }

      return room;
    }),

  // Update room status (host only)
  updateStatus: protectedProcedure
    .input(UpdateRoomStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const roomId = input.roomId.toUpperCase();

      // Verify user is host
      const room = await ctx.db.room.findUnique({
        where: { id: roomId }
      });

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Room not found'
        });
      }

      if (room.hostUserId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the host can update room status'
        });
      }

      // Update room status
      const updatedRoom = await ctx.db.room.update({
        where: { id: roomId },
        data: { status: input.status },
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
      });

      return updatedRoom;
    }),

  // Set player ready status
  setReady: protectedProcedure
    .input(SetPlayerReadySchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const roomId = input.roomId.toUpperCase();

      // Verify player is in room
      const roomPlayer = await ctx.db.roomPlayer.findUnique({
        where: {
          roomId_userId: {
            roomId: roomId,
            userId: userId
          }
        }
      });

      if (!roomPlayer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'You are not in this room'
        });
      }

      // Update ready status
      await ctx.db.roomPlayer.update({
        where: {
          roomId_userId: {
            roomId: roomId,
            userId: userId
          }
        },
        data: { isReady: input.isReady }
      });

      // Return updated room data
      const updatedRoom = await ctx.db.room.findUnique({
        where: { id: roomId },
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
      });

      return updatedRoom;
    }),

  // Leave room
  leave: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const roomId = input.roomId.toUpperCase();

      // Remove player from room
      await ctx.db.roomPlayer.deleteMany({
        where: {
          roomId: roomId,
          userId: userId
        }
      });

      // If host left, delete room (cascade will handle players)
      const room = await ctx.db.room.findUnique({
        where: { id: roomId },
        include: { players: true }
      });

      if (room && room.hostUserId === userId) {
        await ctx.db.room.delete({
          where: { id: roomId }
        });
        return { roomDeleted: true };
      }

      // If room is empty, delete it
      if (room && room.players.length === 0) {
        await ctx.db.room.delete({
          where: { id: roomId }
        });
        return { roomDeleted: true };
      }

      return { roomDeleted: false };
    }),

  // Get user's active rooms
  getUserRooms: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;

      const rooms = await ctx.db.room.findMany({
        where: {
          OR: [
            { hostUserId: userId },
            { 
              players: {
                some: { userId: userId }
              }
            }
          ],
          status: {
            in: ['WAITING', 'ACTIVE']
          }
        },
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return rooms;
    })
}); 