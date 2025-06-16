import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapComponent } from '@/components/common/MapComponent';
import { Loader2, Clock, Users, Trophy, LogOut, MapPin } from 'lucide-react';

interface GameState {
  phase: 'waiting' | 'round-active' | 'round-results' | 'game-finished';
  currentRound: number;
  totalRounds: number;
  imageUrl?: string;
  timeLimit?: number;
  timeRemaining?: number;
  results?: any[];
  finalResults?: any[];
}

interface MultiplayerGameProps {
  room: any;
  user: any;
  socket: any;
  onLeaveRoom: () => void;
}

export function MultiplayerGame({ room, user, socket, onLeaveRoom }: MultiplayerGameProps) {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'waiting',
    currentRound: room.currentRound || 1,
    totalRounds: room.totalRounds
  });
  

  
  // Check if we need to request current round state (room is ACTIVE but we're still waiting)
  useEffect(() => {
    if (room.status === 'ACTIVE' && gameState.phase === 'waiting') {
      
      // Add a small delay to allow event listeners to be registered first
      const timer = setTimeout(() => {
        socket.getRoundState();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [room.status, gameState.phase, socket]);
  
  const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [hasSubmittedGuess, setHasSubmittedGuess] = useState(false);
  const [guessSubmissions, setGuessSubmissions] = useState<Set<string>>(new Set());

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  // Image interaction state
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 });
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  
  const imageRef = React.useRef<HTMLImageElement>(null);

  // Set up socket event listeners
  useEffect(() => {
    const handleGameStarted = (_data: {
      roomId: string;
      roundIndex: number;
    }) => {
      // Request current round state immediately
      socket.getRoundState();
    };

    const handleRoundStarted = (data: {
      roomId: string;
      imageData: { imageUrl: string };
      roundIndex: number;
      timeLimit?: number;
    }) => {
      
      setGameState(prev => {
        const newState = {
          ...prev,
          phase: 'round-active' as const,
          currentRound: data.roundIndex,
          imageUrl: data.imageData.imageUrl,
          timeLimit: data.timeLimit
        };
        return newState;
      });
      
      // Reset guess state
      setGuess(null);
      setHasSubmittedGuess(false);
      setGuessSubmissions(new Set());
      
      // Reset image zoom/pan
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
      
      // Start timer if there's a time limit
      if (data.timeLimit) {
        setTimeRemaining(data.timeLimit);
        setTimerActive(true);
      }
      
    };

    const handleGuessSubmitted = (data: {
      roomId: string;
      playerId: string;
      roundIndex: number;
    }) => {
      setGuessSubmissions(prev => new Set([...prev, data.playerId]));
    };

    const handleRoundEnded = (data: {
      roomId: string;
      results: any[];
      roundIndex: number;
      actualLocation: { lat: number; lng: number };
      imageUrl: string;
    }) => {
      setGameState(prev => ({
        ...prev,
        phase: 'round-results',
        results: data.results
      }));
      setTimerActive(false);
    };

    const handleGameEnded = (data: {
      roomId: string;
      finalResults: any[];
    }) => {
      setGameState(prev => ({
        ...prev,
        phase: 'game-finished',
        finalResults: data.finalResults
      }));
      setTimerActive(false);
    };

    
    socket.on('game-started', handleGameStarted);
    socket.on('round-started', handleRoundStarted);
    socket.on('guess-submitted', handleGuessSubmitted);
    socket.on('round-ended', handleRoundEnded);
    socket.on('game-ended', handleGameEnded);

    return () => {
      socket.off('game-started', handleGameStarted);
      socket.off('round-started', handleRoundStarted);
      socket.off('guess-submitted', handleGuessSubmitted);
      socket.off('round-ended', handleRoundEnded);
      socket.off('game-ended', handleGameEnded);
    };
  }, [socket]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeRemaining]);

  // Image wheel zoom handler
  useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const zoomDelta = e.deltaY < 0 ? 0.2 : -0.2;
      setImageScale(prev => Math.max(0.5, Math.min(4, prev + zoomDelta)));
    };

    imageElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      imageElement.removeEventListener('wheel', handleWheel);
    };
  }, [gameState.imageUrl]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (gameState.phase !== 'round-active' || hasSubmittedGuess) return;
    
    setGuess({ lat, lng });
  }, [gameState.phase, hasSubmittedGuess]);

  const handleSubmitGuess = useCallback(() => {
    if (!guess || hasSubmittedGuess || gameState.phase !== 'round-active') return;

    socket.submitGuess(gameState.currentRound, guess.lat, guess.lng);
    setHasSubmittedGuess(true);
  }, [guess, hasSubmittedGuess, gameState.phase, gameState.currentRound, socket]);

  // Image interaction handlers
  const handleImageClick = (_e: React.MouseEvent) => {
    if (!hasMouseMoved) {
      // Simple click behavior - could add fullscreen toggle here if needed
    }
  };

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDraggingImage(true);
      setHasMouseMoved(false);
      setImageDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
      e.preventDefault();
    }
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (isDraggingImage) {
      setHasMouseMoved(true);
      setImagePosition({
        x: e.clientX - imageDragStart.x,
        y: e.clientY - imageDragStart.y
      });
    }
  };

  const handleImageMouseUp = (_e: React.MouseEvent) => {
    setIsDraggingImage(false);
  };



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Waiting for round to start
  if (gameState.phase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p>Waiting for round to start...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game finished
  if (gameState.phase === 'game-finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">🎉 Game Finished!</h1>
            <Button
              onClick={onLeaveRoom}
              variant="outline"
              className="bg-blue-500/20 border-blue-500/30 text-blue-200 hover:bg-blue-500/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <span>Final Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gameState.finalResults?.map((result, index) => (
                  <div
                    key={result.playerId}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div>
                        <p className="font-semibold">{result.username}</p>
                        {result.playerId === user.id && (
                          <p className="text-sm text-blue-400">You</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{result.totalScore}</p>
                      <p className="text-sm text-white/70">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Active round or round results
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">
              Round {gameState.currentRound} of {gameState.totalRounds}
            </h1>
            {gameState.timeLimit && (
              <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-lg">
                <Clock className="h-4 w-4 text-white/70" />
                <span className={`font-mono text-lg ${
                  timeRemaining !== null && timeRemaining <= 10 ? 'text-red-400' : 'text-white'
                }`}>
                  {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                </span>
              </div>
            )}
          </div>
          <Button
            onClick={onLeaveRoom}
            variant="outline"
            size="sm"
            className="bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave
          </Button>
        </div>

        {/* Player Status */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Players: {guessSubmissions.size}/{room.players.length} submitted</span>
              </div>
              {gameState.phase === 'round-active' && (
                <div className="flex items-center space-x-2">
                  {hasSubmittedGuess ? (
                    <span className="text-green-400">✅ Guess submitted</span>
                  ) : guess ? (
                    <Button
                      onClick={handleSubmitGuess}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Submit Guess
                    </Button>
                  ) : (
                    <span className="text-yellow-400">Click on the map to place your guess</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-250px)]">
          {/* Image */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Guess this location</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full">
              {gameState.imageUrl ? (
                <div className="relative w-full h-full overflow-hidden bg-black/50">
                  <img
                    ref={imageRef}
                    src={gameState.imageUrl}
                    alt="Location to guess"
                    className="w-full h-full object-contain cursor-grab active:cursor-grabbing select-none"
                    style={{
                      transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageScale})`,
                      transformOrigin: 'center center'
                    }}
                    onClick={handleImageClick}
                    onMouseDown={handleImageMouseDown}
                    onMouseMove={handleImageMouseMove}
                    onMouseUp={handleImageMouseUp}
                    onMouseLeave={handleImageMouseUp}
                    draggable={false}
                  />
                  
                  {/* Image controls */}
                  <div className="absolute top-3 right-3 flex flex-col space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-black/80 border-white/30 text-white hover:bg-black/90"
                      onClick={() => setImageScale(prev => Math.min(4, prev + 0.3))}
                    >
                      +
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-black/80 border-white/30 text-white hover:bg-black/90"
                      onClick={() => setImageScale(prev => Math.max(0.5, prev - 0.3))}
                    >
                      -
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-black/80 border-white/30 text-white hover:bg-black/90 text-xs"
                      onClick={() => {
                        setImageScale(1);
                        setImagePosition({ x: 0, y: 0 });
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                  
                  {/* Zoom indicator */}
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs">
                    {Math.round(imageScale * 100)}%
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your guess</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <MapComponent
                onMapClick={handleMapClick}
                userGuess={guess}
                actualLocation={gameState.phase === 'round-results' && gameState.results ? {
                  lat: gameState.results[0]?.actualLat || 0,
                  lng: gameState.results[0]?.actualLng || 0
                } : undefined}
                allGuesses={gameState.phase === 'round-results' ? 
                  gameState.results?.map(r => ({
                    lat: r.guessLat,
                    lng: r.guessLng,
                    playerId: r.playerId,
                    username: r.username
                  })) : undefined
                }
                showResult={gameState.phase === 'round-results'}
                disabled={hasSubmittedGuess || gameState.phase !== 'round-active'}
              />
            </CardContent>
          </Card>
        </div>

        {/* Round Results */}
        {gameState.phase === 'round-results' && gameState.results && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <CardTitle>Round {gameState.currentRound} Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gameState.results.map((result, index) => (
                  <div
                    key={result.playerId}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div>
                        <p className="font-semibold">{result.username}</p>
                        {result.playerId === user.id && (
                          <p className="text-sm text-blue-400">You</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{result.score} points</p>
                      <p className="text-sm text-white/70">
                        {result.hasGuessed ? `${result.distance.toFixed(1)} km` : 'No guess'}
                      </p>
                      <p className="text-sm text-white/70">
                        Total: {result.totalScore}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 