import { io, Socket } from 'socket.io-client';
import { supabase } from './supabase';

// Match the server-side event interfaces
interface ServerToClientEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'player-joined': (data: { roomId: string, player: any }) => void;
  'player-left': (data: { roomId: string, playerId: string }) => void;
  'player-ready': (data: { roomId: string, playerId: string, isReady: boolean }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'game-started': (data: { roomId: string, imageData: any, roundIndex: number }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'round-started': (data: { roomId: string, imageData: any, roundIndex: number, timeLimit?: number }) => void;
  'guess-submitted': (data: { roomId: string, playerId: string, roundIndex: number }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'round-ended': (data: { roomId: string, results: any[], roundIndex: number }) => void;
  'results-countdown': (data: { roomId: string, timeRemaining: number }) => void;
  'next-round-ready': (data: { roomId: string, isHost: boolean }) => void;
  'loading-next-round': (data: { roomId: string }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'game-ended': (data: { roomId: string, finalResults: any[] }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'room-updated': (data: { roomId: string, room: any }) => void;
  'error': (data: { message: string }) => void;
}

interface ClientToServerEvents {
  'join-room': (data: { roomId: string, token: string }) => void;
  'leave-room': (data: { roomId: string }) => void;
  'player-ready': (data: { roomId: string, isReady: boolean }) => void;
  'submit-guess': (data: { roomId: string, roundIndex: number, guessLat: number, guessLng: number }) => void;
  'start-game': (data: { roomId: string }) => void;
  'start-next-round': (data: { roomId: string }) => void;
  'get-round-state': (data: { roomId: string }) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: TypedSocket | null = null;
  private currentRoomId: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    this.socket = null;
  }

  // Initialize socket connection
  connect(): TypedSocket {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Use environment variable or fallback to localhost for development
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    
    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    }) as TypedSocket;

    // Set up default event handlers
    this.socket.on('connect', () => {
    });

    this.socket.on('disconnect', () => {
    });

    this.socket.on('error', (data) => {
      console.error('❌ Socket.IO error:', data.message);
      this.emit('socket-error', data);
    });

    // Forward all events to registered handlers
    this.socket.on('player-joined', (data) => this.emit('player-joined', data));
    this.socket.on('player-left', (data) => this.emit('player-left', data));
    this.socket.on('player-ready', (data) => this.emit('player-ready', data));
    this.socket.on('game-started', (data) => this.emit('game-started', data));
    this.socket.on('round-started', (data) => {
      this.emit('round-started', data);
    });
    this.socket.on('guess-submitted', (data) => this.emit('guess-submitted', data));
    this.socket.on('round-ended', (data) => this.emit('round-ended', data));
    this.socket.on('results-countdown', (data) => this.emit('results-countdown', data));
    this.socket.on('next-round-ready', (data) => this.emit('next-round-ready', data));
    this.socket.on('loading-next-round', (data) => this.emit('loading-next-round', data));
    this.socket.on('game-ended', (data) => this.emit('game-ended', data));
    this.socket.on('room-updated', (data) => this.emit('room-updated', data));

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
      this.eventHandlers.clear();
    }
  }

  // Join a room
  async joinRoom(roomId: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    this.currentRoomId = roomId;
    this.socket.emit('join-room', { roomId, token });
  }

  // Leave current room
  leaveRoom() {
    if (!this.socket || !this.currentRoomId) {
      return;
    }

    this.socket.emit('leave-room', { roomId: this.currentRoomId });
    this.currentRoomId = null;
  }

  // Set player ready status
  setPlayerReady(isReady: boolean) {
    if (!this.socket || !this.currentRoomId) {
      throw new Error('Not connected to a room');
    }

    this.socket.emit('player-ready', { roomId: this.currentRoomId, isReady });
  }

  // Start game (host only)
  startGame() {
    
    if (!this.socket || !this.currentRoomId) {
      console.error('🔌 Cannot start game - socket or room not available');
      throw new Error('Not connected to a room');
    }

    this.socket.emit('start-game', { roomId: this.currentRoomId });
  }

  // Submit guess
  submitGuess(roundIndex: number, guessLat: number, guessLng: number) {
    if (!this.socket || !this.currentRoomId) {
      throw new Error('Not connected to a room');
    }

    this.socket.emit('submit-guess', {
      roomId: this.currentRoomId,
      roundIndex,
      guessLat,
      guessLng
    });
  }

  // Get current round state (for joining active games)
  getRoundState() {
    if (!this.socket || !this.currentRoomId) {
      throw new Error('Not connected to a room');
    }

    this.socket.emit('get-round-state', {
      roomId: this.currentRoomId
    });
  }

  // Event subscription methods
  on<K extends keyof ServerToClientEvents | 'socket-error'>(
    event: K,
    handler: K extends keyof ServerToClientEvents 
      ? ServerToClientEvents[K] 
      : (data: { message: string }) => void
  ) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off<K extends keyof ServerToClientEvents | 'socket-error'>(
    event: K,
    handler: K extends keyof ServerToClientEvents 
      ? ServerToClientEvents[K] 
      : (data: { message: string }) => void
  ) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Emit event to registered handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  // Get current connection status
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get current room ID
  get roomId(): string | null {
    return this.currentRoomId;
  }

  // Start next round (host only, for manual mode)
  startNextRound() {
    if (!this.socket || !this.currentRoomId) {
      console.error('🔌 Cannot start next round - socket or room not available');
      throw new Error('Not connected to a room');
    }

    this.socket.emit('start-next-round', { roomId: this.currentRoomId });
  }
}

// Create singleton instance
export const socketService = new SocketService();

// React hook for using socket service
export function useSocket() {
  return socketService;
} 