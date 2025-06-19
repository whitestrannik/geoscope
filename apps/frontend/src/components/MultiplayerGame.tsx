import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapComponent } from '@/components/common/MapComponent';
import { ImageViewer } from '@/components/common/ImageViewer';
import { GameLayout } from '@/components/common/GameLayout';
import type { LayoutMode } from '@/components/common/GameLayout';
import { Loader2, Clock, Users, Trophy, LogOut, MapPin, Crown } from 'lucide-react';

interface GameState {
  phase: 'waiting' | 'round-active' | 'round-results' | 'waiting-for-host' | 'loading-next-round' | 'game-finished';
  currentRound: number;
  totalRounds: number;
  imageUrl?: string;
  timeLimit?: number;
  timeRemaining?: number;
  results?: any[];
  finalResults?: any[];
  countdownTime?: number;
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
  
  // Separate states for results display
  const [showResultsOnMap, setShowResultsOnMap] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [persistedResults, setPersistedResults] = useState<any[] | null>(null);
  const [persistedActualLocation, setPersistedActualLocation] = useState<{ lat: number; lng: number } | null>(null);
  
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
      
      // Reset results display for new round
      setShowResultsOnMap(false);
      setShowResultModal(false);
      setPersistedResults(null);
      setPersistedActualLocation(null);
      
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
      
      // Set results display states
      setShowResultsOnMap(true);
      setShowResultModal(true);
      setPersistedResults(data.results);
      setPersistedActualLocation(data.actualLocation);
    };

    const handleResultsCountdown = (data: {
      roomId: string;
      timeRemaining: number;
    }) => {
      setGameState(prev => ({
        ...prev,
        // Keep in round-results phase but add countdown time
        countdownTime: data.timeRemaining
      }));
    };

    const handleNextRoundReady = (data: {
      roomId: string;
      isHost: boolean;
    }) => {
      setGameState(prev => ({
        ...prev,
        phase: 'waiting-for-host'
      }));
    };

    const handleLoadingNextRound = (data: {
      roomId: string;
    }) => {
      setGameState(prev => ({
        ...prev,
        phase: 'loading-next-round'
      }));
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
    socket.on('results-countdown', handleResultsCountdown);
    socket.on('next-round-ready', handleNextRoundReady);
    socket.on('loading-next-round', handleLoadingNextRound);
    socket.on('game-ended', handleGameEnded);

    return () => {
      socket.off('game-started', handleGameStarted);
      socket.off('round-started', handleRoundStarted);
      socket.off('guess-submitted', handleGuessSubmitted);
      socket.off('round-ended', handleRoundEnded);
      socket.off('results-countdown', handleResultsCountdown);
      socket.off('next-round-ready', handleNextRoundReady);
      socket.off('loading-next-round', handleLoadingNextRound);
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
    if (gameState.phase === 'round-active' && !hasSubmittedGuess) {
      setGuess({ lat, lng });
    }
    // Allow map interaction during results phase for exploration
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

  // Results countdown (auto mode) - removed, now handled within round-results phase

  // Waiting for host (manual mode)
  if (gameState.phase === 'waiting-for-host') {
    const isHost = user.id === room.hostUserId;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              {isHost ? (
                <>
                  <Crown className="h-8 w-8 mx-auto text-yellow-400" />
                  <p className="text-lg">Ready for next round?</p>
                  <p className="text-sm text-gray-300">You can start when everyone is ready</p>
                  <Button
                    onClick={() => socket.startNextRound()}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    🚀 Start Next Round
                  </Button>
                </>
              ) : (
                <>
                  <Clock className="h-8 w-8 animate-pulse mx-auto text-blue-400" />
                  <p className="text-lg">Waiting for host...</p>
                  <p className="text-sm text-gray-300">The host will start the next round</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading next round
  if (gameState.phase === 'loading-next-round') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-lg">Loading next round...</p>
              <p className="text-sm text-gray-300">Preparing new location...</p>
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
              showInstructions={false}
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
            actualLocation={showResultsOnMap && persistedActualLocation ? persistedActualLocation : null}
            allGuesses={showResultsOnMap && persistedResults ? 
              persistedResults.map(r => ({
                lat: r.guessLat,
                lng: r.guessLng,
                playerId: r.playerId,
                username: r.username
              })) : undefined
            }
            showResult={showResultsOnMap}
            resultData={showResultsOnMap && persistedResults ? 
              (() => {
                const userResult = persistedResults.find(r => r.playerId === user.id);
                return userResult ? { distance: userResult.distance, score: userResult.score } : null;
              })() : null
            }
            disabled={gameState.phase !== 'round-active' && gameState.phase !== 'round-results'}
            className="h-full"
          />
        </CardContent>
      </Card>
    );

    // Action section component
    const actionSection = (
      <>
        {/* Player Status */}
        <Card className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-lg border-slate-600/40 text-white w-full max-w-2xl min-w-[600px] shadow-xl">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-400/30">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-300">Players</div>
                  <div className="font-semibold text-lg">
                    {guessSubmissions.size}/{room.players.length} submitted
                  </div>
                </div>
              </div>
              {gameState.phase === 'round-active' && (
                <div className="flex items-center justify-center sm:justify-end w-full sm:w-80">
                  {hasSubmittedGuess ? (
                    <div className="flex items-center space-x-2 bg-green-500/20 border border-green-400/30 px-4 py-2 rounded-lg min-w-[180px] justify-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-medium">Guess submitted</span>
                    </div>
                  ) : guess ? (
                    <Button
                      onClick={handleSubmitGuess}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg border border-green-500/30 transition-all duration-200 px-6 py-2 min-w-[180px]"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Submit Guess
                    </Button>
                  ) : (
                    <div className="bg-amber-500/20 border border-amber-400/30 px-4 py-2 rounded-lg text-center sm:text-left min-w-[280px]">
                      <span className="text-amber-400 font-medium">Right-click on the map to place your guess</span>
                    </div>
                  )}
                </div>
              )}
              {gameState.phase === 'round-results' && (
                <div className="flex items-center justify-center sm:justify-end w-full sm:w-80">
                  {room.autoAdvance && gameState.countdownTime !== undefined ? (
                    <div className="flex items-center space-x-3 bg-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-lg min-w-[200px] justify-center">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{gameState.countdownTime}</div>
                        <div className="text-xs text-blue-300">Next round in...</div>
                      </div>
                    </div>
                  ) : !room.autoAdvance ? (
                    user.id === room.hostUserId ? (
                      <Button
                        onClick={() => socket.startNextRound()}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg border border-blue-500/30 px-6 py-2 min-w-[180px]"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Start Next Round
                      </Button>
                    ) : (
                      <div className="bg-blue-500/20 border border-blue-400/30 px-4 py-2 rounded-lg text-center sm:text-left min-w-[280px]">
                        <span className="text-blue-400 text-sm font-medium">
                          📊 Review results - Host will start next round
                        </span>
                      </div>
                    )
                  ) : null}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </>
    );

    // Results overlay component
    const resultsOverlay = showResultModal && gameState.results ? (
      <Card 
        className="bg-slate-900/95 backdrop-blur-lg border-white/30 text-white shadow-2xl max-w-2xl w-full mx-4 cursor-pointer hover:bg-slate-900/98 transition-colors"
        onClick={() => setShowResultModal(false)}
      >
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl text-center">Round {gameState.currentRound} Results</CardTitle>
          <p className="text-center text-sm text-gray-300">
            {!room.autoAdvance && gameState.phase === 'round-results' 
              ? "Examine results - Host will start next round" 
              : room.autoAdvance && gameState.countdownTime !== undefined
              ? `Review results - Next round starts in ${gameState.countdownTime}s`
              : "Click anywhere to continue"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gameState.results.map((result, index) => (
              <div
                key={result.playerId}
                className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20"
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
                  <p className="font-bold text-xl">{result.score} points</p>
                  <p className="text-sm text-gray-300">
                    {result.hasGuessed ? `${result.distance.toFixed(1)} km` : 'No guess'}
                  </p>
                  <p className="text-sm text-gray-300">
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
      <div className="flex items-center gap-3 text-center">
        <span className="text-gray-300">Multiplayer Controls:</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Left-click</kbd> Fullscreen</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Right-click</kbd> Guess</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Scroll</kbd> Zoom</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Drag</kbd> Pan</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">F</kbd> Photo</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">M</kbd> Map</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Esc</kbd> Exit</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Enter</kbd> Submit</span>
      </div>
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