import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapComponent } from '@/components/common/MapComponent';
import { ImageViewer } from '@/components/common/ImageViewer';
import { GameLayout } from '@/components/common/GameLayout';
import type { LayoutMode } from '@/components/common/GameLayout';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

type GameState = 'loading' | 'playing' | 'result';

interface GameData {
  id: string;
  imageUrl: string;
  actualLat: number;
  actualLng: number;
  location?: string;
  copyright?: string;
}

interface GuessData {
  lat: number;
  lng: number;
}

interface ResultData {
  distance: number;
  score: number;
  actualLat: number;
  actualLng: number;
  guessLat: number;
  guessLng: number;
}

export function SoloPage() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>('loading');
  const [currentGame, setCurrentGame] = useState<GameData | null>(null);
  const [userGuess, setUserGuess] = useState<GuessData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [showResultsOnMap, setShowResultsOnMap] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // tRPC hooks
  const { data: imageData, isLoading: imageLoading, error: imageError, refetch: refetchImage } = trpc.image.getRandom.useQuery();

  // Use submitSoloGuess for authenticated users (stores in database), evaluate for guests
  const evaluateGuessMutation = user 
    ? trpc.guess.submitSoloGuess.useMutation({
        onSuccess: (data) => {
          setResult(data);
          setGameState('result');
          setShowResultsOnMap(true);
          setShowResultModal(true);
        },
        onError: (error) => {
          console.error('Error submitting guess:', error);
          alert('Error submitting your guess. Please try again.');
        }
      })
    : trpc.guess.evaluate.useMutation({
        onSuccess: (data) => {
          setResult(data);
          setGameState('result');
          setShowResultsOnMap(true);
          setShowResultModal(true);
        },
        onError: (error) => {
          console.error('Error evaluating guess:', error);
          alert('Error evaluating your guess. Please try again.');
        }
      });

  // Handle image data changes
  React.useEffect(() => {
    if (imageData) {
      setCurrentGame(imageData);
      setGameState('playing');
      setUserGuess(null);
      setResult(null);
      setShowResultsOnMap(false);
      setShowResultModal(false);
    }
  }, [imageData]);

  const handleMarkerPlace = (lat: number, lng: number) => {
    setUserGuess({ lat, lng });
  };

  const handleMapDoubleClick = () => {
    setLayoutMode(prev => prev === 'map-full' ? 'split' : 'map-full');
  };

  const handleSubmitGuess = () => {
    if (!currentGame || !userGuess) return;

    evaluateGuessMutation.mutate({
      imageId: currentGame.id,
      imageUrl: currentGame.imageUrl,
      guessLat: userGuess.lat,
      guessLng: userGuess.lng,
      actualLat: currentGame.actualLat,
      actualLng: currentGame.actualLng
    });
  };

  const handlePlayAgain = () => {
    setGameState('loading');
    setLayoutMode('split');
    setShowResultsOnMap(false);
    setShowResultModal(false);
    refetchImage();
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-400';
    if (score >= 600) return 'text-yellow-400';
    if (score >= 400) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 950) return 'Perfect! 🎯';
    if (score >= 900) return 'Excellent! 🌟';
    if (score >= 800) return 'Great job! 👏';
    if (score >= 700) return 'Good guess! 👍';
    if (score >= 600) return 'Not bad! 🤔';
    if (score >= 500) return 'Keep trying! 💪';
    if (score >= 400) return 'Getting warmer! 🔥';
    if (score >= 300) return 'Could be better! 📍';
    if (score >= 200) return 'Way off! 🌍';
    if (score >= 100) return 'Very far! ✈️';
    return 'Ouch! 😅';
  };

  // Loading state
  if (gameState === 'loading' || imageLoading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-lg text-gray-300 font-mono">[ INITIALIZING MISSION... ]</div>
        </div>
      </div>
    );
  }

  // Error state
  if (imageError || !currentGame) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <div className="bg-black/70 backdrop-blur-md border border-red-500/30 rounded-lg p-8 text-center space-y-6 max-w-md">
          <div>
            <h1 className="text-2xl font-mono text-red-400 mb-2">[ MISSION FAILURE ]</h1>
            <p className="text-gray-300 font-mono">
              {imageError?.message || 'Failed to load game data. Please try again.'}
            </p>
          </div>
          <Button 
            onClick={() => refetchImage()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-mono shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
          >
            [ RETRY MISSION ]
          </Button>
        </div>
      </div>
    );
  }

  // Image section component
  const imageSection = (
    <Card className="bg-black/80 backdrop-blur-md border-cyan-500/30 text-white shadow-2xl shadow-cyan-500/10 h-full flex flex-col hover:border-cyan-400/50 transition-all duration-300">
      <CardHeader className="pb-3 flex-shrink-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-mono text-cyan-300 flex items-center">
            <span className="text-cyan-400 mr-2">📸</span>
            [ TARGET VISUAL ]
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs font-mono text-cyan-300">
              &gt; ANALYZE
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 pt-0 min-h-0">
        <div className="flex-1 min-h-0 h-full relative">
          <ImageViewer
            imageUrl={currentGame.imageUrl}
            alt="Mystery location"
            copyright={currentGame.copyright}
            onFullscreenToggle={() => setLayoutMode(prev => prev === 'image-full' ? 'split' : 'image-full')}
            showFullscreenButton={true}
            showInstructions={false}
            isFullscreen={layoutMode === 'image-full'}
            className="h-full w-full"
          />
          {/* Gaming-style scanning overlay animation */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-cyan-400/60 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-cyan-400/60 animate-pulse"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-cyan-400/60 animate-pulse"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-cyan-400/60 animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Map section component
  const mapSection = (
    <Card className="bg-black/80 backdrop-blur-md border-purple-500/30 text-white shadow-2xl shadow-purple-500/10 h-full flex flex-col hover:border-purple-400/50 transition-all duration-300">
      <CardHeader className="pb-3 flex-shrink-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-mono text-purple-300 flex items-center">
            <span className="text-purple-400 mr-2">🎯</span>
            [ TARGETING SYSTEM ]
          </CardTitle>
          <div className="flex items-center gap-2">
            {userGuess && gameState === 'playing' && (
              <div className="text-xs text-purple-300 bg-purple-500/20 border border-purple-400/30 px-2 py-1 rounded font-mono flex items-center">
                <span className="text-purple-400 mr-1">●</span>
                {userGuess.lat.toFixed(2)}, {userGuess.lng.toFixed(2)}
              </div>
            )}
            {!userGuess && gameState === 'playing' && (
              <div className="bg-amber-500/20 border border-amber-400/30 px-2 py-1 rounded text-xs font-mono text-amber-300">
                &gt; AWAITING TARGET
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 pt-0 min-h-0">
        <div className="flex-1 min-h-0 h-full relative">
          <MapComponent
            onMarkerPlace={handleMarkerPlace}
            onDoubleClick={handleMapDoubleClick}
            guessMarker={userGuess}
            actualMarker={showResultsOnMap ? { lat: currentGame.actualLat, lng: currentGame.actualLng } : null}
            showResult={showResultsOnMap}
            resultData={showResultsOnMap && result ? { distance: result.distance, score: result.score } : null}
            className="h-full w-full"
          />
          {/* Gaming-style radar scanning effect */}
          {!userGuess && gameState === 'playing' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="text-purple-400/60 font-mono text-sm animate-pulse">
                [ RIGHT-CLICK TO PLACE TARGET MARKER ]
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Action section component
  const actionSection = (
    <>
      {/* Enhanced Gaming-style Solo Status Panel */}
      <div className="bg-gradient-to-r from-black/90 to-slate-900/90 backdrop-blur-lg border border-cyan-500/40 text-white px-6 py-4 rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-cyan-500/20 p-3 rounded-lg border border-cyan-400/30 shadow-lg shadow-cyan-500/20">
              <div className="h-6 w-6 text-cyan-400 flex items-center justify-center font-mono">⚡</div>
            </div>
            <div>
              <div className="text-xs text-cyan-300 font-mono uppercase tracking-wider">[ SOLO MISSION ]</div>
              <div className="font-semibold text-lg font-mono text-white">
                {gameState === 'playing' ? 
                  (userGuess ? '> TARGET LOCKED' : '> SCANNING LOCATION...') : 
                  gameState === 'result' ? '> MISSION COMPLETE' : 
                  '> INITIALIZING...'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {gameState === 'playing' && !userGuess && (
              <div className="bg-amber-500/20 border border-amber-400/30 px-4 py-2 rounded-lg text-sm font-mono">
                <span className="text-amber-400 font-medium animate-pulse">● RIGHT-CLICK MAP TO TARGET</span>
              </div>
            )}
            {gameState === 'playing' && userGuess && !evaluateGuessMutation.isPending && (
              <Button
                onClick={handleSubmitGuess}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-mono font-bold px-6 py-3 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
              >
                <span className="mr-2">🚀</span>
                [ LAUNCH STRIKE ]
              </Button>
            )}
            {evaluateGuessMutation.isPending && (
              <div className="flex items-center space-x-3 bg-blue-500/20 border border-blue-400/30 px-4 py-2 rounded-lg text-sm font-mono">
                <div className="relative">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-blue-300 font-medium">CALCULATING TRAJECTORY...</span>
              </div>
            )}
            {gameState === 'result' && (
              <Button
                onClick={handlePlayAgain}
                size="lg"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-mono font-bold px-6 py-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
              >
                <span className="mr-2">⚡</span>
                [ NEW MISSION ]
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Legacy action buttons for keyboard shortcuts display */}
      <div className="hidden">
        {gameState === 'playing' && (
          <>
            <Button
              onClick={handleSubmitGuess}
              disabled={!userGuess || evaluateGuessMutation.isPending}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 sm:px-8 text-base sm:text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 w-full sm:w-auto"
            >
              {evaluateGuessMutation.isPending ? '⏳ Calculating...' : '✅ Submit Guess'}
            </Button>
            {userGuess && (
              <div className="text-xs sm:text-sm text-gray-300 text-center">
                Press <kbd className="bg-white/20 px-1 rounded text-white">Enter</kbd> to submit
              </div>
            )}
          </>
        )}

        {gameState === 'result' && result && (
          <>
            <Button
              onClick={handlePlayAgain}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 sm:px-8 text-base sm:text-lg transition-all duration-200 hover:scale-105 w-full sm:w-auto"
            >
              🎮 Play Again
            </Button>
            <div className="text-xs sm:text-sm text-gray-300 text-center">
              Press <kbd className="bg-white/20 px-1 rounded text-white">N</kbd> for new game
            </div>
          </>
        )}
      </div>
    </>
  );

  // Results overlay component
  const resultsOverlay = showResultModal && result ? (
    <div 
      className="bg-black/95 backdrop-blur-xl border border-cyan-500/50 text-white shadow-2xl shadow-cyan-500/20 max-w-2xl w-full mx-4 cursor-pointer hover:bg-black/98 hover:border-cyan-400/60 transition-all duration-300 rounded-xl p-8"
      onClick={() => setShowResultModal(false)}
    >
      <div className="pb-6 text-center">
        <h2 className="text-3xl font-mono text-cyan-400 mb-2 flex items-center justify-center">
          <span className="mr-3">🎯</span>
          [ MISSION RESULTS ]
          <span className="ml-3">🎯</span>
        </h2>
        <p className="text-sm text-gray-300 font-mono animate-pulse">
          &gt; CLICK ANYWHERE TO CONTINUE TO NEXT MISSION
        </p>
      </div>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-3 bg-gradient-to-b from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-4">
            <div className="text-3xl animate-pulse">📏</div>
            <div className="text-sm font-bold text-blue-300 font-mono uppercase tracking-wider">[ Distance ]</div>
            <div className="text-2xl text-blue-400 font-bold font-mono">{result.distance.toLocaleString()} KM</div>
          </div>
          
          <div className="space-y-3 bg-gradient-to-b from-green-600/20 to-emerald-800/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-3xl animate-pulse">🏆</div>
            <div className="text-sm font-bold text-green-300 font-mono uppercase tracking-wider">[ Score ]</div>
            <div className={`text-3xl font-bold font-mono ${getScoreColor(result.score)}`}>
              {result.score.toLocaleString()}
            </div>
            <div className="text-sm text-gray-300 font-mono">{getScoreMessage(result.score)}</div>
          </div>
          
          <div className="space-y-3 bg-gradient-to-b from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-lg p-4">
            <div className="text-3xl animate-pulse">📍</div>
            <div className="text-sm font-bold text-purple-300 font-mono uppercase tracking-wider">[ Target Location ]</div>
            <div className="text-sm text-purple-400 font-mono">
              {currentGame.location || `${result.actualLat.toFixed(2)}, ${result.actualLng.toFixed(2)}`}
            </div>
          </div>
        </div>
        
        {/* Gaming-style divider */}
        <div className="mt-6 pt-6 border-t border-cyan-500/30">
          <div className="text-center text-xs text-gray-400 font-mono">
            &gt; MISSION #{Math.floor(Math.random() * 9999).toString().padStart(4, '0')} COMPLETED
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <GameLayout
      layoutMode={layoutMode}
      onLayoutModeChange={setLayoutMode}
      imageSection={imageSection}
      mapSection={mapSection}
      actionSection={actionSection}
      resultsOverlay={resultsOverlay}
      title="🎮 Solo Mode"
      subtitle="Click on photo or map to go fullscreen"
      showHomeButton={true}
      enableKeyboardShortcuts={true}
      onEnterPress={userGuess && gameState === 'playing' && !evaluateGuessMutation.isPending ? handleSubmitGuess : undefined}
      onNPress={gameState === 'result' ? handlePlayAgain : undefined}
      showHelpOverlay={true}
    />
  );
} 