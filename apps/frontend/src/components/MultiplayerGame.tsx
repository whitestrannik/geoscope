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
      // Check if we're currently in the last round results phase
      if (gameState.phase === 'round-results' && gameState.currentRound === gameState.totalRounds) {
        // Give players time to see the last round results before showing final screen
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            phase: 'game-finished',
            finalResults: data.finalResults
          }));
          setTimerActive(false);
        }, 5000); // 5 second delay to view last round results
      } else {
        // Regular game end (shouldn't happen but just in case)
        setGameState(prev => ({
          ...prev,
          phase: 'game-finished',
          finalResults: data.finalResults
        }));
        setTimerActive(false);
      }
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
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-lg text-gray-300 font-mono">[ AWAITING MISSION ORDERS... ]</div>
        </div>
      </div>
    );
  }

  // Results countdown (auto mode) - removed, now handled within round-results phase

  // Waiting for host (manual mode)
  if (gameState.phase === 'waiting-for-host') {
    const isHost = user.id === room.hostUserId;
    
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="bg-black/70 backdrop-blur-md border border-purple-500/30 rounded-lg p-8 text-center space-y-6 max-w-md">
          {isHost ? (
            <>
              <Crown className="h-12 w-12 mx-auto text-yellow-400" />
              <div>
                <div className="text-xl font-mono text-yellow-400 mb-2">[ COMMANDER STATUS ]</div>
                <p className="text-gray-300 font-mono mb-2">Ready to deploy next mission?</p>
                <p className="text-sm text-gray-400 font-mono">All operatives await your orders</p>
              </div>
              <Button
                onClick={() => socket.startNextRound()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-mono shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105"
              >
                🚀 [ LAUNCH NEXT ROUND ]
              </Button>
            </>
          ) : (
            <>
              <div className="animate-pulse">
                <Clock className="h-12 w-12 mx-auto text-cyan-400 mb-4" />
              </div>
              <div>
                <div className="text-xl font-mono text-cyan-400 mb-2">[ STANDBY MODE ]</div>
                <p className="text-gray-300 font-mono mb-2">Awaiting commander orders...</p>
                <p className="text-sm text-gray-400 font-mono">Host will initiate next deployment</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Loading next round
  if (gameState.phase === 'loading-next-round') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-lg text-gray-300 font-mono">[ LOADING NEXT MISSION... ]</div>
          <div className="text-sm text-gray-400 font-mono mt-2">Preparing tactical insertion...</div>
        </div>
      </div>
    );
  }

  // Game finished state
  if (gameState.phase === 'game-finished' && gameState.finalResults) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-black via-slate-900 to-purple-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Gaming Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <h1 className="text-4xl font-bold text-yellow-400 font-mono">[ MISSION COMPLETE ]</h1>
            </div>
            <Button
              onClick={onLeaveRoom}
              variant="outline"
              className="bg-red-500/20 border-red-500/30 text-red-200 hover:bg-red-500/30 font-mono"
            >
              <LogOut className="h-4 w-4 mr-2" />
              [ EXIT ]
            </Button>
          </div>

          {/* Final Results */}
          <Card className="bg-black/80 backdrop-blur-md border-purple-500/30 text-white shadow-2xl shadow-purple-500/10">
            <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/20">
              <CardTitle className="flex items-center gap-3 text-2xl font-mono text-purple-300">
                <span className="text-purple-400">🏆</span>
                [ FINAL BATTLE RANKINGS ]
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {gameState.finalResults.map((result, index) => (
                  <div
                    key={result.playerId}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                      result.playerId === user.id 
                        ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
                        : index === 0
                        ? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                        : 'bg-gradient-to-r from-purple-600/10 to-slate-600/10 border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl font-mono">
                        {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div>
                        <p className="font-bold text-xl font-mono text-white">{result.username}</p>
                        {result.playerId === user.id && (
                          <p className="text-sm text-cyan-400 font-mono">[ YOUR RESULTS ]</p>
                        )}
                        {index === 0 && result.playerId !== user.id && (
                          <p className="text-sm text-yellow-400 font-mono">[ CHAMPION ]</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-2xl font-mono text-white">{result.totalScore} PTS</p>
                      <p className="text-sm text-gray-300 font-mono">
                        {gameState.totalRounds} MISSIONS COMPLETED
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Gaming-style footer */}
              <div className="mt-8 pt-6 border-t border-purple-500/30">
                <div className="text-center text-xs text-gray-400 font-mono">
                  &gt; OPERATION COMPLETE - ALL OBJECTIVES ACHIEVED
                </div>
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
      <Card className="bg-black/80 backdrop-blur-md border-cyan-500/30 text-white shadow-2xl shadow-cyan-500/10 overflow-hidden h-full hover:border-cyan-400/50 transition-all duration-300">
        <CardHeader className="pb-3 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-cyan-500/20">
          <CardTitle className="text-lg font-mono text-cyan-300 flex items-center">
            <span className="text-cyan-400 mr-2">📸</span>
            [ INTEL FEED ]
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs font-mono text-cyan-300">
                &gt; ROUND {gameState.currentRound}/{gameState.totalRounds}
              </div>
              {gameState.timeLimit && timeRemaining !== null && (
                <div className={`bg-red-500/20 border border-red-400/30 px-2 py-1 rounded text-xs font-mono ${
                  timeRemaining <= 10 ? 'text-red-300 animate-pulse' : 'text-red-400'
                }`}>
                  ⏱ {formatTime(timeRemaining)}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-full relative">
          {gameState.imageUrl ? (
            <>
              <ImageViewer
                imageUrl={gameState.imageUrl}
                alt="Location to guess"
                onFullscreenToggle={() => setLayoutMode(prev => prev === 'image-full' ? 'split' : 'image-full')}
                showFullscreenButton={true}
                showInstructions={false}
                isFullscreen={layoutMode === 'image-full'}
                className="h-full"
              />
              {/* Gaming-style scanning overlay animation */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-cyan-400/60 animate-pulse"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-cyan-400/60 animate-pulse"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-cyan-400/60 animate-pulse"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-cyan-400/60 animate-pulse"></div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="relative">
                  <div className="w-8 h-8 bg-cyan-400 rounded-full animate-ping mx-auto mb-3"></div>
                  <div className="absolute inset-0 w-8 h-8 bg-cyan-500 rounded-full mx-auto"></div>
                </div>
                <p className="text-cyan-300 font-mono text-sm">[ LOADING INTEL... ]</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );

    // Map section component
    const mapSection = (
      <Card className="bg-black/80 backdrop-blur-md border-purple-500/30 text-white shadow-2xl shadow-purple-500/10 overflow-hidden h-full hover:border-purple-400/50 transition-all duration-300">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/20">
          <CardTitle className="text-lg font-mono text-purple-300 flex items-center">
            <span className="text-purple-400 mr-2">🎯</span>
            [ TACTICAL MAP ]
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {guess && gameState.phase === 'round-active' && (
                <div className="text-xs text-purple-300 bg-purple-500/20 border border-purple-400/30 px-2 py-1 rounded font-mono flex items-center">
                  <span className="text-purple-400 mr-1">●</span>
                  {guess.lat.toFixed(2)}, {guess.lng.toFixed(2)}
                </div>
              )}
              {!guess && gameState.phase === 'round-active' && (
                <div className="bg-amber-500/20 border border-amber-400/30 px-2 py-1 rounded text-xs font-mono text-amber-300">
                  &gt; AWAITING COORDINATES
                </div>
              )}
              {gameState.phase === 'round-results' && (
                <div className="bg-green-500/20 border border-green-400/30 px-2 py-1 rounded text-xs font-mono text-green-300">
                  &gt; MISSION COMPLETE
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-full relative">
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
          {/* Gaming-style radar scanning effect */}
          {!guess && gameState.phase === 'round-active' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="text-purple-400/60 font-mono text-sm animate-pulse">
                [ RIGHT-CLICK TO DEPLOY MARKER ]
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );

    // Action section component
    const actionSection = (
      <>
        {/* Enhanced Gaming-style Multiplayer Status Panel */}
        <div className="bg-gradient-to-r from-black/90 to-slate-900/90 backdrop-blur-lg border border-purple-500/40 text-white px-6 py-4 rounded-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all duration-300">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-500/20 p-3 rounded-lg border border-purple-400/30 shadow-lg shadow-purple-500/20">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="text-xs text-purple-300 font-mono uppercase tracking-wider">[ MULTIPLAYER BATTLE ]</div>
                <div className="font-semibold text-lg font-mono text-white">
                  {gameState.phase === 'round-active' ? 
                    `> ${guessSubmissions.size}/${room.players.length} OPERATIVES READY` : 
                    gameState.phase === 'round-results' ? '> ANALYZING RESULTS...' : 
                    '> AWAITING ORDERS...'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {gameState.phase === 'round-active' && (
                <>
                  {hasSubmittedGuess ? (
                    <div className="flex items-center space-x-3 bg-green-500/20 border border-green-400/30 px-4 py-2 rounded-lg text-sm font-mono">
                      <div className="relative">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-green-300 font-medium">COORDINATES LOCKED</span>
                    </div>
                  ) : guess ? (
                    <Button
                      onClick={handleSubmitGuess}
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-mono font-bold px-6 py-3 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
                    >
                      <span className="mr-2">🚀</span>
                      [ DEPLOY STRIKE ]
                    </Button>
                  ) : (
                    <div className="bg-amber-500/20 border border-amber-400/30 px-4 py-2 rounded-lg text-sm font-mono">
                      <span className="text-amber-400 font-medium animate-pulse">● RIGHT-CLICK MAP TO TARGET</span>
                    </div>
                  )}
                </>
              )}
              {gameState.phase === 'round-results' && (
                <>
                  {room.autoAdvance && gameState.countdownTime !== undefined ? (
                    <div className="flex items-center space-x-3 bg-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-lg text-sm font-mono">
                      <div className="relative">
                        <div className="w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-300 font-mono">{gameState.countdownTime}</div>
                        <div className="text-xs text-blue-400 font-mono">NEXT ROUND DEPLOYING...</div>
                      </div>
                    </div>
                  ) : !room.autoAdvance ? (
                    user.id === room.hostUserId ? (
                      <Button
                        onClick={() => socket.startNextRound()}
                        size="lg"
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-mono font-bold px-6 py-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
                      >
                        <span className="mr-2">👑</span>
                        [ LAUNCH NEXT ROUND ]
                      </Button>
                    ) : (
                      <div className="bg-cyan-500/20 border border-cyan-400/30 px-4 py-2 rounded-lg text-sm font-mono">
                        <span className="text-cyan-400 font-medium animate-pulse">
                          ● AWAITING COMMANDER ORDERS
                        </span>
                      </div>
                    )
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );

    // Results overlay component
    const resultsOverlay = showResultModal && gameState.results ? (
      <Card 
        className="bg-black/95 backdrop-blur-xl border border-purple-500/50 text-white shadow-2xl shadow-purple-500/20 max-w-3xl w-full mx-4 cursor-pointer hover:bg-black/98 hover:border-purple-400/60 transition-all duration-300 rounded-xl"
        onClick={() => setShowResultModal(false)}
      >
        <CardHeader className="pb-6">
          <CardTitle className="text-3xl font-mono text-purple-400 text-center mb-2 flex items-center justify-center">
            <span className="mr-3">⚔</span>
            [ BATTLE RESULTS - ROUND {gameState.currentRound} ]
            <span className="ml-3">⚔</span>
          </CardTitle>
          <p className="text-center text-sm text-gray-300 font-mono animate-pulse">
            {gameState.currentRound === gameState.totalRounds 
              ? "&gt; FINAL ROUND COMPLETE - MISSION SUMMARY LOADING IN 5S..."
              : !room.autoAdvance && gameState.phase === 'round-results' 
              ? "&gt; EXAMINE TACTICAL DATA - COMMANDER WILL DEPLOY NEXT ROUND" 
              : room.autoAdvance && gameState.countdownTime !== undefined
              ? `&gt; ANALYZE RESULTS - NEXT DEPLOYMENT IN ${gameState.countdownTime}S`
              : "&gt; CLICK ANYWHERE TO CONTINUE MISSION"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gameState.results.map((result, index) => (
              <div
                key={result.playerId}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                  result.playerId === user.id 
                    ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
                    : 'bg-gradient-to-r from-purple-600/10 to-slate-600/10 border-purple-500/30'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-mono">
                    {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div>
                    <p className="font-bold text-xl font-mono text-white">{result.username}</p>
                    {result.playerId === user.id && (
                      <p className="text-sm text-cyan-400 font-mono">[ YOU ]</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-2xl font-mono text-white">{result.score} PTS</p>
                  <p className="text-sm text-gray-300 font-mono">
                    {result.hasGuessed ? `${result.distance.toFixed(1)} KM` : 'NO STRIKE'}
                  </p>
                  <p className="text-sm text-purple-400 font-mono">
                    TOTAL: {result.totalScore}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Gaming-style divider */}
          <div className="mt-6 pt-6 border-t border-purple-500/30">
            <div className="text-center text-xs text-gray-400 font-mono">
              &gt; OPERATION #{Math.floor(Math.random() * 9999).toString().padStart(4, '0')} - ROUND {gameState.currentRound} COMPLETE
            </div>
          </div>
        </CardContent>
      </Card>
    ) : null;

    // Custom help content for multiplayer
    const customHelpContent = (
      <div className="flex items-center gap-3 text-center flex-wrap justify-center">
        <span className="text-purple-300 font-mono">[ MULTIPLAYER CONTROLS ]:</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Left-click</kbd> Fullscreen</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Right-click</kbd> Target</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Scroll</kbd> Zoom</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Drag</kbd> Pan</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">F</kbd> Intel</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">M</kbd> Map</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Esc</kbd> Exit</span>
        <span><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Enter</kbd> Deploy</span>
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