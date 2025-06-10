import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { useSocket } from '@/lib/socket';
import { Link } from 'react-router-dom';
import { Loader2, Users, Crown, CheckCircle, XCircle, Settings, Play, LogOut, Copy, Wifi, WifiOff } from 'lucide-react';

interface RoomData {
  id: string;
  hostUserId: string;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  maxPlayers: number;
  currentRound: number;
  totalRounds: number;
  roundTimeLimit?: number;
  createdAt: string;
  host: {
    id: string;
    username?: string;
    email: string;
  };
  players: Array<{
    id: string;
    userId: string;
    joinedAt: string;
    score: number;
    isReady: boolean;
    user: {
      id: string;
      username?: string;
      email: string;
    };
  }>;
}

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

  const updateStatusMutation = trpc.room.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Failed to update room status:', error);
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
    const socketInstance = socket.connect();
    setSocketConnected(socket.isConnected);

    // Join the room
    socket.joinRoom(roomId).catch(error => {
      console.error('Failed to join room via socket:', error);
    });

    // Set up event listeners
    const handlePlayerJoined = (data: { roomId: string, player: any }) => {
      console.log('Player joined:', data);
      refetch();
    };

    const handlePlayerLeft = (data: { roomId: string, playerId: string }) => {
      console.log('Player left:', data);
      refetch();
    };

    const handlePlayerReady = (data: { roomId: string, playerId: string, isReady: boolean }) => {
      console.log('Player ready status changed:', data);
      if (data.playerId === user.id) {
        setIsReady(data.isReady);
      }
      refetch();
    };

    const handleGameStarted = (data: { roomId: string, imageData: any, roundIndex: number }) => {
      console.log('Game started:', data);
      refetch();
      // TODO: Navigate to game view
    };

    const handleRoomUpdated = (data: { roomId: string, room: any }) => {
      console.log('Room updated:', data);
      refetch();
    };

    const handleSocketError = (data: { message: string }) => {
      console.error('Socket error:', data.message);
    };

    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerLeft);
    socket.on('player-ready', handlePlayerReady);
    socket.on('game-started', handleGameStarted);
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
      socket.off('room-updated', handleRoomUpdated);
      socket.off('socket-error', handleSocketError);
      socket.leaveRoom();
    };
  }, [roomId, user, socket, refetch]);

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
              This room doesn't exist or you don't have access to it
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

  const isHost = user.id === room.hostUserId;
  const isInRoom = room.players.some((p: any) => p.userId === user.id);
  const allPlayersReady = room.players.every((p: any) => p.isReady);
  const canStartGame = isHost && allPlayersReady && room.players.length >= 2 && room.status === 'WAITING';

  if (!isInRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">🚫 Access Denied</CardTitle>
            <CardDescription className="text-gray-300">
              You are not a member of this room
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

  const handleReadyToggle = () => {
    // Use Socket.IO for real-time updates
    if (socketConnected) {
      try {
        socket.setPlayerReady(!isReady);
      } catch (error) {
        console.error('Socket.IO ready toggle failed, falling back to HTTP:', error);
        // Fallback to HTTP
        setReadyMutation.mutate({
          roomId: room.id,
          isReady: !isReady
        });
      }
    } else {
      // Use HTTP as fallback
      setReadyMutation.mutate({
        roomId: room.id,
        isReady: !isReady
      });
    }
  };

  const handleStartGame = () => {
    // Use Socket.IO for real-time game start
    if (socketConnected) {
      try {
        socket.startGame();
      } catch (error) {
        console.error('Socket.IO start game failed, falling back to HTTP:', error);
        // Fallback to HTTP
        updateStatusMutation.mutate({
          roomId: room.id,
          status: 'ACTIVE'
        });
      }
    } else {
      // Use HTTP as fallback
      updateStatusMutation.mutate({
        roomId: room.id,
        status: 'ACTIVE'
      });
    }
  };

  const handleLeaveRoom = () => {
    leaveMutation.mutate({
      roomId: room.id
    });
  };

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  🏠 Room {room.id}
                  {isHost && <Crown className="h-5 w-5 text-yellow-400" />}
                  {socketConnected ? (
                    <Wifi className="h-4 w-4 text-green-400" title="Real-time connected" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-400" title="Real-time disconnected" />
                  )}
                </CardTitle>
                <CardDescription className="text-gray-300 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {room.players.length}/{room.maxPlayers} players
                  </span>
                  <span>•</span>
                  <span>{room.totalRounds} rounds</span>
                  {room.roundTimeLimit && (
                    <>
                      <span>•</span>
                      <span>{room.roundTimeLimit}s per round</span>
                    </>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyRoomCode}
                  variant="outline"
                  size="sm"
                  className="bg-black/50 text-white border-white/30 hover:bg-black/70"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copySuccess ? 'Copied!' : 'Copy Code'}
                </Button>
                <Button
                  onClick={handleLeaveRoom}
                  variant="outline"
                  size="sm"
                  className="bg-red-500/20 text-red-200 border-red-500/30 hover:bg-red-500/30"
                  disabled={leaveMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Leave
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({room.players.length}/{room.maxPlayers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {room.players.map((player: any) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {player.userId === room.hostUserId && (
                            <Crown className="h-4 w-4 text-yellow-400" />
                          )}
                          <span className="font-medium">
                            {player.user.username || player.user.email.split('@')[0]}
                          </span>
                          {player.userId === user.id && (
                            <span className="text-xs text-blue-300">(You)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {room.status !== 'WAITING' && (
                          <span className="text-sm text-gray-300">
                            Score: {player.score}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {player.isReady ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400" />
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
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Game Status */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Game Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      room.status === 'WAITING' ? 'text-yellow-400' :
                      room.status === 'ACTIVE' ? 'text-green-400' :
                      'text-gray-400'
                    }`}>
                      {room.status === 'WAITING' ? 'Waiting' :
                       room.status === 'ACTIVE' ? 'Playing' :
                       'Finished'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connection:</span>
                    <span className={`font-medium ${socketConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {socketConnected ? 'Real-time' : 'Offline'}
                    </span>
                  </div>
                  {room.status === 'ACTIVE' && (
                    <div className="flex justify-between">
                      <span>Round:</span>
                      <span>{room.currentRound}/{room.totalRounds}</span>
                    </div>
                  )}
                </div>

                {room.status === 'WAITING' && (
                  <>
                    {/* Ready Button */}
                    <Button
                      onClick={handleReadyToggle}
                      disabled={setReadyMutation.isPending}
                      className={`w-full ${isReady ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                      {setReadyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : isReady ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {isReady ? 'Ready!' : 'Not Ready'}
                    </Button>

                    {/* Start Game (Host Only) */}
                    {isHost && (
                      <Button
                        onClick={handleStartGame}
                        disabled={!canStartGame || updateStatusMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updateStatusMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Start Game
                      </Button>
                    )}

                    {/* Ready Status */}
                    <div className="text-sm text-center">
                      {allPlayersReady ? (
                        <span className="text-green-400">✅ All players ready!</span>
                      ) : (
                        <span className="text-yellow-400">
                          ⏳ Waiting for {room.players.filter((p: any) => !p.isReady).length} player(s)
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg">💡 Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {room.status === 'WAITING' ? (
                  <>
                    <p>• Share the room code <strong>{room.id}</strong> with friends</p>
                    <p>• Mark yourself as ready when you're set to play</p>
                    {isHost ? (
                      <p>• Start the game when all players are ready</p>
                    ) : (
                      <p>• Wait for the host to start the game</p>
                    )}
                    <p>• Minimum 2 players required to start</p>
                    <p>• {socketConnected ? '⚡ Real-time updates enabled' : '🔄 Updates via refresh'}</p>
                  </>
                ) : room.status === 'ACTIVE' ? (
                  <>
                    <p>• Game is in progress</p>
                    <p>• Round {room.currentRound} of {room.totalRounds}</p>
                    <p>• Good luck!</p>
                  </>
                ) : (
                  <>
                    <p>• Game has finished</p>
                    <p>• Check final scores above</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 