import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapComponent } from '@/components/common/MapComponent';
import { ImageViewer } from '@/components/common/ImageViewer';
import { GameLayout } from '@/components/common/GameLayout';
import type { LayoutMode } from '@/components/common/GameLayout';
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
  
  // Layout mode state for consistency with Solo mode
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  
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
      
      // Reset layout mode
      setLayoutMode('split');
      
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

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (gameState.phase !== 'round-active' || hasSubmittedGuess) return;
    
    setGuess({ lat, lng });
  }, [gameState.phase, hasSubmittedGuess]);

  const handleMapDoubleClick = () => {
    setLayoutMode(prev => prev === 'map-full' ? 'split' : 'map-full');
  };

  const handleSubmitGuess = useCallback(() => {
    if (!guess || hasSubmittedGuess || gameState.phase !== 'round-active') return;

    socket.submitGuess(gameState.currentRound, guess.lat, guess.lng);
    setHasSubmittedGuess(true);
  }, [guess, hasSubmittedGuess, gameState.phase, gameState.currentRound, socket]);

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

  // Game finished state
  if (gameState.phase === 'game-finished' && gameState.finalResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">🏆 Game Complete!</h1>
            <Button
              onClick={onLeaveRoom}
              variant="outline"
              className="bg-black/50 text-white border-white/30 hover:bg-black/70"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
          </div>

          {/* Final Results */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Final Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gameState.finalResults.map((result, index) => (
                  <div
                    key={result.playerId}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{result.username}</p>
                        {result.playerId === user.id && (
                          <p className="text-sm text-blue-400">You</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl">{result.totalScore} points</p>
                      <p className="text-sm text-white/70">
                        {result.roundsPlayed} rounds played
                      </p>
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

  // Active round state - use GameLayout for consistency
  if (gameState.phase === 'round-active' || gameState.phase === 'round-results') {
    // Header actions for multiplayer
    const headerActions = (
      <>
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
        <Button
          onClick={onLeaveRoom}
          variant="outline"
          size="sm"
          className="bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Leave
        </Button>
      </>
    );

    // Image section component
    const imageSection = (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Guess this location</CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-full">
          {gameState.imageUrl ? (
            <ImageViewer
              imageUrl={gameState.imageUrl}
              alt="Location to guess"
              onFullscreenToggle={() => setLayoutMode(prev => prev === 'image-full' ? 'split' : 'image-full')}
              showFullscreenButton={true}
              showZoomControls={false}
              showInstructions={true}
              isFullscreen={layoutMode === 'image-full'}
              className="h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>
    );

    // Map section component
    const mapSection = (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your guess</CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-full">
          <MapComponent
            onMapClick={handleMapClick}
            onDoubleClick={handleMapDoubleClick}
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
    );

    // Action section component
    const actionSection = (
      <>
        {/* Player Status */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white w-full max-w-2xl">
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
      </>
    );

    // Results overlay component
    const resultsOverlay = gameState.phase === 'round-results' && gameState.results ? (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white max-w-2xl w-full mx-4">
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
    ) : null;

    // Custom help content for multiplayer
    const customHelpContent = (
      <>
        <div className="text-gray-300 mb-1">Multiplayer Controls:</div>
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            <span><kbd className="bg-white/20 px-1 rounded">Click</kbd> Fullscreen</span>
            <span><kbd className="bg-white/20 px-1 rounded">Scroll</kbd> Zoom</span>
            <span><kbd className="bg-white/20 px-1 rounded">Drag</kbd> Pan</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <span><kbd className="bg-white/20 px-1 rounded">F</kbd> Photo</span>
            <span><kbd className="bg-white/20 px-1 rounded">M</kbd> Map</span>
            <span><kbd className="bg-white/20 px-1 rounded">Esc</kbd> Exit</span>
            <span><kbd className="bg-white/20 px-1 rounded">Enter</kbd> Submit</span>
          </div>
        </div>
      </>
    );

    return (
      <GameLayout
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        imageSection={imageSection}
        mapSection={mapSection}
        actionSection={actionSection}
        resultsOverlay={resultsOverlay}
        title={`Round ${gameState.currentRound} of ${gameState.totalRounds}`}
        showHomeButton={false}
        headerActions={headerActions}
        enableKeyboardShortcuts={true}
        onEnterPress={guess && gameState.phase === 'round-active' && !hasSubmittedGuess ? handleSubmitGuess : undefined}
        showHelpOverlay={true}
        customHelpContent={customHelpContent}
      />
    );
  }

  // Fallback
  return null;
} 