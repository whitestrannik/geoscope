import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { useSocket } from '@/lib/socket';
import { Link } from 'react-router-dom';
import { Loader2, Users, Crown, CheckCircle, XCircle, Play, LogOut, Copy, Wifi, WifiOff } from 'lucide-react';
import { MultiplayerGame } from '@/components/MultiplayerGame';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const [isReady, setIsReady] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // tRPC queries and mutations
  const { data: room, isLoading, error, refetch } = trpc.room.get.useQuery(
    { roomId: roomId! },
    { enabled: !!roomId }
  );

  const setReadyMutation = trpc.room.setReady.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Failed to update ready status:', error);
    }
  });

  const leaveMutation = trpc.room.leave.useMutation({
    onSuccess: () => {
      navigate('/');
    },
    onError: (error) => {
      console.error('Failed to leave room:', error);
    }
  });

  // Socket.IO integration
  useEffect(() => {
    if (!roomId || !user) return;

    // Connect to Socket.IO
    socket.connect();
    setSocketConnected(socket.isConnected);

    // Join the room (only if not already in this room)
    if (socket.roomId !== roomId.toUpperCase()) {
      socket.joinRoom(roomId).catch(error => {
        console.error('Failed to join room via socket:', error);
      });
    }

    // Set up event listeners
    const handlePlayerJoined = (_data: { roomId: string, player: any }) => {
      refetch();
    };

    const handlePlayerLeft = (_data: { roomId: string, playerId: string }) => {
      refetch();
    };

    const handlePlayerReady = (data: { roomId: string, playerId: string, isReady: boolean }) => {
      if (data.playerId === user.id) {
        setIsReady(data.isReady);
      }
      refetch();
    };

    const handleGameStarted = (_data: { roomId: string, imageData: any, roundIndex: number }) => {
      refetch();
    };

    // RoomPage should NOT handle round-started events - MultiplayerGame handles them
    // const handleRoundStarted = (data: { roomId: string, imageData: any, roundIndex: number, timeLimit?: number }) => {
    //   console.log('🏠 RoomPage: Round started event received (this should NOT happen when room is ACTIVE):', data);
    //   console.log('🏠 RoomPage: Current room status:', room?.status);
    //   refetch();
    // };

    const handleRoundEnded = (_data: { roomId: string, results: any[], roundIndex: number }) => {
      refetch();
    };

    const handleGameEnded = (_data: { roomId: string, finalResults: any[] }) => {
      refetch();
    };

    const handleRoomUpdated = (_data: { roomId: string, room: any }) => {
      refetch();
    };

    const handleSocketError = (data: { message: string }) => {
      console.error('Socket error:', data.message);
    };

    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerLeft);
    socket.on('player-ready', handlePlayerReady);
    socket.on('game-started', handleGameStarted);
    // Only listen to game events if room is not ACTIVE (MultiplayerGame handles these when active)
    if (room?.status !== 'ACTIVE') {
      // Note: round-started is handled by MultiplayerGame only
      socket.on('round-ended', handleRoundEnded);
      socket.on('game-ended', handleGameEnded);
    }
    socket.on('room-updated', handleRoomUpdated);
    socket.on('socket-error', handleSocketError);

    // Monitor connection status
    const connectionInterval = setInterval(() => {
      setSocketConnected(socket.isConnected);
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(connectionInterval);
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-left', handlePlayerLeft);
      socket.off('player-ready', handlePlayerReady);
      socket.off('game-started', handleGameStarted);
      // Only clean up game events if we were listening to them
      if (room?.status !== 'ACTIVE') {
        // Note: round-started is handled by MultiplayerGame only
        socket.off('round-ended', handleRoundEnded);
        socket.off('game-ended', handleGameEnded);
      }
      socket.off('room-updated', handleRoomUpdated);
      socket.off('socket-error', handleSocketError);
      
      // Don't leave room when transitioning to MultiplayerGame (room status ACTIVE)
      // Only leave room when actually leaving the page
      if (room?.status !== 'ACTIVE') {
        socket.leaveRoom();
      }
    };
  }, [roomId, user?.id, socket]);

  // Check if current user is in the room and get their ready status
  useEffect(() => {
    if (room && user) {
      const currentPlayer = room.players.find((p: any) => p.userId === user.id);
      if (currentPlayer) {
        setIsReady(currentPlayer.isReady);
      }
    }
  }, [room, user]);

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">🔒 Authentication Required</CardTitle>
            <CardDescription className="text-gray-300">
              You need to be logged in to view this room
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/">
              <Button className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p>Loading room...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">❌ Room Not Found</CardTitle>
            <CardDescription className="text-gray-300">
              {error?.message || 'This room does not exist or you do not have access to it.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/">
              <Button className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Define handler functions first
  const handleLeaveRoom = () => {
    socket.leaveRoom();
    leaveMutation.mutate({ roomId: room.id });
  };

  const handleReadyToggle = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    
    // Update via Socket.IO for real-time
    socket.setPlayerReady(newReadyState);
    
    // Also update via tRPC for persistence
    setReadyMutation.mutate({
      roomId: room.id,
      isReady: newReadyState
    });
  };

  const handleStartGame = async () => {
    if (!canStartGame) {
      return;
    }
    
    // Start game via Socket.IO
    socket.startGame();
    
    // Refetch room data to get updated status
    try {
      await refetch();
    } catch (error) {
      console.error('🎮 Refetch failed:', error);
    }
  };

  // Show game interface if room is active
  if (room.status === 'ACTIVE') {
    return (
      <MultiplayerGame 
        room={room} 
        user={user} 
        socket={socket}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // Check if current user is the host
  const isHost = user.id === room.hostUserId;
  const allPlayersReady = room.players.every(p => p.isReady);
  const canStartGame = isHost && allPlayersReady && room.players.length >= 2;

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  const getUserDisplayName = (user: { username?: string | null, email: string }) => {
    return user.username || user.email.split('@')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-white/70 hover:text-white">
              ← Back to Home
            </Link>
            <div className="flex items-center space-x-2">
              {socketConnected ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-sm text-white/70">
                {socketConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLeaveRoom}
            className="bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Room
          </Button>
        </div>

        {/* Room Info */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center space-x-2">
                  <span>🏠 Room {room.id}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyRoomCode}
                    className="text-white/70 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </CardTitle>
                {copySuccess && (
                  <p className="text-sm text-green-400 mt-1">Room code copied!</p>
                )}
                <CardDescription className="text-gray-300">
                  Host: {getUserDisplayName(room.host)} • {room.players.length}/{room.maxPlayers} players
                </CardDescription>
              </div>
              <div className="text-right text-sm text-white/70">
                <p>{room.totalRounds} rounds</p>
                {room.roundTimeLimit && (
                  <p>{room.roundTimeLimit}s per round</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Players List */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Players ({room.players.length}/{room.maxPlayers})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {player.userId === room.hostUserId && (
                        <Crown className="h-4 w-4 text-yellow-400" />
                      )}
                      <span className="font-medium">
                        {getUserDisplayName(player.user)}
                      </span>
                      {player.userId === user.id && (
                        <span className="text-sm text-blue-400">(You)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-white/70">
                      Score: {player.score}
                    </span>
                    <div className="flex items-center space-x-1">
                      {player.isReady ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span className="text-sm">
                        {player.isReady ? 'Ready' : 'Not Ready'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Game Controls */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Game Controls</h3>
                <p className="text-sm text-white/70">
                  {allPlayersReady 
                    ? "All players are ready! Host can start the game."
                    : "Waiting for all players to be ready..."
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleReadyToggle}
                  variant={isReady ? "default" : "outline"}
                  className={
                    isReady
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                      : "bg-red-600/20 hover:bg-red-600/30 text-red-200 border-red-500/50 hover:text-red-100"
                  }
                  disabled={setReadyMutation.isPending}
                >
                  {setReadyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isReady ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {isReady ? 'Ready' : 'Not Ready'}
                </Button>
                
                {isHost && (
                  <Button
                    onClick={handleStartGame}
                    disabled={!canStartGame}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Game
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 