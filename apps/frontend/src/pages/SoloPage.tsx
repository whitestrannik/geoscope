import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapComponent } from '@/components/common/MapComponent';
import { trpc } from '@/lib/trpc';

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

// Updated to include fullscreen modes
type LayoutMode = 'split' | 'image-focus' | 'map-focus' | 'image-full' | 'map-full';

export function SoloPage() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [currentGame, setCurrentGame] = useState<GameData | null>(null);
  const [userGuess, setUserGuess] = useState<GuessData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');

  // tRPC hooks
  const { data: imageData, isLoading: imageLoading, error: imageError, refetch: refetchImage } = trpc.image.getRandom.useQuery();

  const evaluateGuessMutation = trpc.guess.evaluate.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setGameState('result');
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
    }
  }, [imageData]);

  // Simplified keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key) {
        case 'f':
        case 'F':
          // Toggle image focus/fullscreen
          setLayoutMode(prev => prev === 'image-full' ? 'image-focus' : 'image-full');
          break;
        case '2':
          setLayoutMode('split');
          break;
        case 'm':
        case 'M':
          // Toggle map focus/fullscreen
          setLayoutMode(prev => prev === 'map-full' ? 'map-focus' : 'map-full');
          break;
        case 'Escape':
          // Exit fullscreen to split view
          if (layoutMode === 'image-full' || layoutMode === 'map-full') {
            setLayoutMode('split');
          }
          break;
        case 'Enter':
          if (userGuess && gameState === 'playing' && !evaluateGuessMutation.isPending) {
            handleSubmitGuess();
          }
          break;
        case 'n':
        case 'N':
          if (gameState === 'result') {
            handlePlayAgain();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [userGuess, gameState, evaluateGuessMutation.isPending, layoutMode]);

  const handleMarkerPlace = (lat: number, lng: number) => {
    setUserGuess({ lat, lng });
  };

  const handleSubmitGuess = () => {
    if (!currentGame || !userGuess) return;

    evaluateGuessMutation.mutate({
      imageId: currentGame.id,
      guessLat: userGuess.lat,
      guessLng: userGuess.lng,
      actualLat: currentGame.actualLat,
      actualLng: currentGame.actualLng
    });
  };

  const handlePlayAgain = () => {
    setGameState('loading');
    setLayoutMode('split');
    refetchImage();
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-400';
    if (score >= 500) return 'text-yellow-400';
    if (score >= 200) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 900) return '🎯 Perfect!';
    if (score >= 700) return '🎉 Excellent!';
    if (score >= 500) return '👍 Good!';
    if (score >= 200) return '👌 Not bad!';
    return '💪 Keep trying!';
  };

  if (imageLoading || gameState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-lg">Loading your challenge...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
          <CardContent className="text-center py-12">
            <p className="text-lg text-red-300 mb-4">Failed to load image</p>
            <Button onClick={() => refetchImage()} className="bg-blue-600 hover:bg-blue-700 text-white">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
          <CardContent className="text-center py-12">
            <p className="text-lg text-yellow-300 mb-4">No image data available</p>
            <Button onClick={() => refetchImage()} className="bg-blue-600 hover:bg-blue-700 text-white">
              Load Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Simplified layout controls - each button toggles between normal and fullscreen
  const renderLayoutControls = () => (
    <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-lg p-1">
      <Button
        onClick={() => setLayoutMode(layoutMode === 'image-full' ? 'image-focus' : 'image-full')}
        size="sm"
        variant={layoutMode === 'image-focus' || layoutMode === 'image-full' ? 'default' : 'ghost'}
        className="text-xs h-8 px-3 text-white hover:text-white"
        title={layoutMode === 'image-full' ? 'Exit image fullscreen (Press F)' : 'Focus on image (Press F)'}
      >
        📷 {layoutMode === 'image-full' ? 'Exit' : 'Photo'}
      </Button>
      <Button
        onClick={() => setLayoutMode('split')}
        size="sm"
        variant={layoutMode === 'split' ? 'default' : 'ghost'}
        className="text-xs h-8 px-3 text-white hover:text-white"
        title="Balanced view (Press 2)"
      >
        ⚖️ Both
      </Button>
      <Button
        onClick={() => setLayoutMode(layoutMode === 'map-full' ? 'map-focus' : 'map-full')}
        size="sm"
        variant={layoutMode === 'map-focus' || layoutMode === 'map-full' ? 'default' : 'ghost'}
        className="text-xs h-8 px-3 text-white hover:text-white"
        title={layoutMode === 'map-full' ? 'Exit map fullscreen (Press M)' : 'Focus on map (Press M)'}
      >
        🗺️ {layoutMode === 'map-full' ? 'Exit' : 'Map'}
      </Button>
    </div>
  );

  const renderImageSection = (className: string = '', isFullscreen: boolean = false) => (
    <div className={className}>
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📍 Where is this photo taken?</CardTitle>
            {isFullscreen && (
              <Button
                onClick={() => setLayoutMode('split')}
                size="sm"
                variant="outline"
                className="text-xs h-8 px-3 text-white border-white/30 hover:bg-white/10 hover:text-white"
                title="Exit fullscreen (Press Esc)"
              >
                ✕ Exit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div 
            className="relative group flex-1 min-h-0 cursor-pointer"
            onClick={() => setLayoutMode(layoutMode === 'image-full' ? 'split' : 'image-full')}
          >
            <img
              src={currentGame.imageUrl}
              alt="Mystery location"
              className="w-full h-full object-cover rounded-lg transition-all duration-200 group-hover:brightness-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                {layoutMode === 'image-full' ? '↩️ Exit fullscreen' : '⛶ Go fullscreen'}
              </div>
            </div>
          </div>
          
          {currentGame.copyright && (
            <div className="mt-3 text-xs text-gray-400">
              📸 {currentGame.copyright}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderMapSection = (className: string = '', isFullscreen: boolean = false) => (
    <div className={className}>
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">🗺️ Make your guess</CardTitle>
            <div className="flex items-center gap-2">
              {userGuess && gameState === 'playing' && (
                <div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                  📍 Placed at {userGuess.lat.toFixed(2)}, {userGuess.lng.toFixed(2)}
                </div>
              )}
              {isFullscreen && (
                <Button
                  onClick={() => setLayoutMode('split')}
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-3 text-white border-white/30 hover:bg-white/10 hover:text-white"
                  title="Exit fullscreen (Press Esc)"
                >
                  ✕ Exit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 min-h-0">
            <MapComponent
              onMarkerPlace={handleMarkerPlace}
              guessMarker={userGuess}
              actualMarker={gameState === 'result' ? { lat: currentGame.actualLat, lng: currentGame.actualLng } : null}
              showResult={gameState === 'result'}
              className="h-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGameContent = () => {
    switch (layoutMode) {
      case 'image-full':
        return (
          <div className="h-[calc(100vh-120px)] flex flex-col">
            {renderImageSection('flex-1', true)}
          </div>
        );
      
      case 'map-full':
        return (
          <div className="h-[calc(100vh-120px)] flex flex-col">
            {renderMapSection('flex-1', true)}
          </div>
        );
      
      case 'image-focus':
        return (
          <div className="h-[calc(100vh-200px)] flex gap-4">
            {renderImageSection('flex-[2]')}
            {renderMapSection('flex-[1]')}
          </div>
        );
      
      case 'map-focus':
        return (
          <div className="h-[calc(100vh-200px)] flex gap-4">
            {renderImageSection('flex-[1]')}
            {renderMapSection('flex-[2]')}
          </div>
        );
      
      default: // 'split'
        return (
          <div className="h-[calc(100vh-200px)] flex gap-4">
            {renderImageSection('flex-1')}
            {renderMapSection('flex-1')}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header - Hide in fullscreen mode */}
      {layoutMode !== 'image-full' && layoutMode !== 'map-full' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">🎮 Solo Mode</h1>
            {renderLayoutControls()}
          </div>
          <Link to="/">
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 hover:text-white">
              ← Home
            </Button>
          </Link>
        </div>
      )}

      {/* Game Content */}
      {renderGameContent()}

      {/* Action Zone - Hide in fullscreen */}
      {layoutMode !== 'image-full' && layoutMode !== 'map-full' && (
        <div className="flex items-center justify-center gap-4">
          {gameState === 'playing' && (
            <>
              <Button
                onClick={handleSubmitGuess}
                disabled={!userGuess || evaluateGuessMutation.isPending}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
              >
                {evaluateGuessMutation.isPending ? '⏳ Calculating...' : '✅ Submit Guess'}
              </Button>
              {userGuess && (
                <div className="text-sm text-gray-300">
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 text-lg transition-all duration-200 hover:scale-105"
              >
                🎮 Play Again
              </Button>
              <div className="text-sm text-gray-300">
                Press <kbd className="bg-white/20 px-1 rounded text-white">N</kbd> for new game
              </div>
            </>
          )}
        </div>
      )}

      {/* Results Card - Hide in fullscreen */}
      {gameState === 'result' && result && layoutMode !== 'image-full' && layoutMode !== 'map-full' && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">🎯 Round Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-2xl">📏</div>
                <div className="text-lg font-semibold">Distance</div>
                <div className="text-2xl text-blue-300">{result.distance.toLocaleString()} km</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl">🏆</div>
                <div className="text-lg font-semibold">Score</div>
                <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score.toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">{getScoreMessage(result.score)}</div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl">📍</div>
                <div className="text-lg font-semibold">Actual Location</div>
                <div className="text-sm text-gray-300">
                  {currentGame.location || `${result.actualLat.toFixed(2)}, ${result.actualLng.toFixed(2)}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs backdrop-blur-sm border border-white/20">
        <div className="text-gray-300 mb-1">Shortcuts:</div>
        <div className="space-y-1">
          <div><kbd className="bg-white/20 px-1 rounded">F</kbd> Photo • <kbd className="bg-white/20 px-1 rounded">2</kbd> Both • <kbd className="bg-white/20 px-1 rounded">M</kbd> Map</div>
          <div><kbd className="bg-white/20 px-1 rounded">Esc</kbd> Exit • <kbd className="bg-white/20 px-1 rounded">Enter</kbd> Submit</div>
        </div>
      </div>
    </div>
  );
} 