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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p>Loading new location...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (imageError || !currentGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <p className="text-red-400">Failed to load image</p>
              <Button onClick={() => refetchImage()} className="bg-blue-600 hover:bg-blue-700">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Image section component
  const imageSection = (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">📍 Where is this photo taken?</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        <div className="flex-1 min-h-0">
          <ImageViewer
            imageUrl={currentGame.imageUrl}
            alt="Mystery location"
            copyright={currentGame.copyright}
            onFullscreenToggle={() => setLayoutMode(prev => prev === 'image-full' ? 'split' : 'image-full')}
            showFullscreenButton={true}
            showInstructions={false}
            isFullscreen={layoutMode === 'image-full'}
            className="h-full"
          />
        </div>
      </CardContent>
    </Card>
  );

  // Map section component
  const mapSection = (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">🗺️ Make your guess</CardTitle>
          <div className="flex items-center gap-2">
            {userGuess && gameState === 'playing' && (
              <div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                📍 {userGuess.lat.toFixed(2)}, {userGuess.lng.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        <div className="flex-1 min-h-0">
          <MapComponent
            onMarkerPlace={handleMarkerPlace}
            onDoubleClick={handleMapDoubleClick}
            guessMarker={userGuess}
            actualMarker={showResultsOnMap ? { lat: currentGame.actualLat, lng: currentGame.actualLng } : null}
            showResult={showResultsOnMap}
            resultData={showResultsOnMap && result ? { distance: result.distance, score: result.score } : null}
            className="h-full"
          />
        </div>
      </CardContent>
    </Card>
  );

  // Action section component
  const actionSection = (
    <>
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
    </>
  );

  // Results overlay component
  const resultsOverlay = showResultModal && result ? (
    <Card 
      className="bg-slate-900/95 backdrop-blur-lg border-white/30 text-white shadow-2xl max-w-lg w-full mx-4 cursor-pointer hover:bg-slate-900/98 transition-colors"
      onClick={() => setShowResultModal(false)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-xl sm:text-2xl text-center">🎯 Round Results</CardTitle>
        <p className="text-center text-sm text-gray-300">Click anywhere to continue</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
          <div className="space-y-2">
            <div className="text-2xl sm:text-3xl">📏</div>
            <div className="text-sm sm:text-base font-semibold text-gray-200">Distance</div>
            <div className="text-xl sm:text-2xl text-blue-300 font-bold">{result.distance.toLocaleString()} km</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl sm:text-3xl">🏆</div>
            <div className="text-sm sm:text-base font-semibold text-gray-200">Score</div>
            <div className={`text-2xl sm:text-3xl font-bold ${getScoreColor(result.score)}`}>
              {result.score.toLocaleString()}
            </div>
            <div className="text-sm text-gray-300">{getScoreMessage(result.score)}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl sm:text-3xl">📍</div>
            <div className="text-sm sm:text-base font-semibold text-gray-200">Actual Location</div>
            <div className="text-sm text-gray-300">
              {currentGame.location || `${result.actualLat.toFixed(2)}, ${result.actualLng.toFixed(2)}`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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