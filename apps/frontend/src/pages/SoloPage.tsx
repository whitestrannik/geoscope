import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// Simplified layout modes: split (default) or fullscreen
type LayoutMode = 'split' | 'image-full' | 'map-full';

export function SoloPage() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [currentGame, setCurrentGame] = useState<GameData | null>(null);
  const [userGuess, setUserGuess] = useState<GuessData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  
  // Image zoom/pan state
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 });
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  
  // Ref for the image element to attach native wheel listener
  const imageRef = React.useRef<HTMLImageElement>(null);

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
      // Reset image zoom/pan
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
    }
  }, [imageData]);

  // Add native wheel event listener to image with proper options
  React.useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const zoomDelta = e.deltaY < 0 ? 0.2 : -0.2;
      setImageScale(prev => Math.max(0.5, Math.min(4, prev + zoomDelta)));
    };

    // Add listener with passive: false to ensure preventDefault works
    imageElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      imageElement.removeEventListener('wheel', handleWheel);
    };
  }, [currentGame]); // Re-attach when image changes

  // Simplified keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key) {
        case 'f':
        case 'F':
          // Toggle image fullscreen
          setLayoutMode(prev => prev === 'image-full' ? 'split' : 'image-full');
          break;
        case 'm':
        case 'M':
          // Toggle map fullscreen
          setLayoutMode(prev => prev === 'map-full' ? 'split' : 'map-full');
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

  const handleMapDoubleClick = () => {
    setLayoutMode(prev => prev === 'map-full' ? 'split' : 'map-full');
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

  // Image interaction handlers
  const handleImageClick = (_e: React.MouseEvent) => {
    // Only toggle fullscreen if this was a click, not a drag
    if (!hasMouseMoved) {
      setLayoutMode(prev => prev === 'image-full' ? 'split' : 'image-full');
    }
  };

  // Remove the React wheel handler since we're using native listener
  // const handleImageWheel = (e: React.WheelEvent) => { ... }

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
      // Track that mouse has moved during drag
      setHasMouseMoved(true);
      setImagePosition({
        x: e.clientX - imageDragStart.x,
        y: e.clientY - imageDragStart.y
      });
    }
  };

  const handleImageMouseUp = (e: React.MouseEvent) => {
    if (isDraggingImage) {
      setIsDraggingImage(false);
      // Small delay to handle click vs drag distinction
      setTimeout(() => {
        if (!hasMouseMoved) {
          handleImageClick(e);
        }
        setHasMouseMoved(false);
      }, 10);
    }
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
    if (score >= 200) return '🤔 Not bad';
    return '💪 Try again!';
  };

  if (imageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="text-4xl">🌍</div>
              <div className="text-lg">Loading mystery location...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (imageError || !currentGame) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
          <CardContent className="text-center p-8 space-y-4">
            <div className="text-4xl">⚠️</div>
            <div className="text-lg text-red-300">Failed to load game data</div>
            <Button 
              onClick={() => refetchImage()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Load Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderImageSection = (className: string = '', isFullscreen: boolean = false) => (
    <div className={className}>
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📍 Where is this photo taken?</CardTitle>
            <div className="flex items-center gap-2">
              {imageScale !== 1 && (
                <div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded font-mono">
                  {Math.round(imageScale * 100)}%
                </div>
              )}
              {isFullscreen && (
                <Button
                  onClick={() => setLayoutMode('split')}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2 bg-black/50 text-white border-white/30 hover:bg-black/70 hover:text-white hover:border-white/50"
                  title="Back to split view (Press Esc)"
                >
                  ← Back
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0">
          <div 
            className="relative group flex-1 min-h-0 overflow-hidden select-none"
            onClick={(e) => {
              // Allow fullscreen toggle when clicking on container (black bars) but not on image
              if (e.target === e.currentTarget) {
                setLayoutMode(prev => prev === 'image-full' ? 'split' : 'image-full');
              }
            }}
          >
            <img
              ref={imageRef}
              src={currentGame.imageUrl}
              alt="Mystery location"
              className="w-full h-full object-contain transition-transform duration-75"
              style={{
                transform: `scale(${imageScale}) translate(${imagePosition.x / imageScale}px, ${imagePosition.y / imageScale}px)`,
                cursor: isDraggingImage ? 'grabbing' : (imageScale > 1 ? 'grab' : 'pointer')
              }}
              onMouseDown={handleImageMouseDown}
              onMouseMove={handleImageMouseMove}
              onMouseUp={handleImageMouseUp}
              onMouseLeave={handleImageMouseUp}
              draggable={false}
            />
            
            {/* Interactive overlay */}
            <div 
              className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none"
            >
              <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                {layoutMode === 'image-full' ? '↩️ Back to split view' : '⛶ Go fullscreen'}
              </div>
            </div>

            {/* Zoom/pan instructions */}
            {!isDraggingImage && (
              <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {imageScale === 1 ? 'Click: fullscreen • Scroll: zoom' : 'Drag: pan • Scroll: zoom'}
              </div>
            )}
          </div>
          
          {currentGame.copyright && (
            <div className="mt-2 text-xs text-gray-400">
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
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">🗺️ Make your guess</CardTitle>
            <div className="flex items-center gap-2">
              {userGuess && gameState === 'playing' && (
                <div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                  📍 {userGuess.lat.toFixed(2)}, {userGuess.lng.toFixed(2)}
                </div>
              )}
              {isFullscreen && (
                <Button
                  onClick={() => setLayoutMode('split')}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2 bg-black/50 text-white border-white/30 hover:bg-black/70 hover:text-white hover:border-white/50"
                  title="Back to split view (Press Esc)"
                >
                  ← Back
                </Button>
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
          <div className="h-screen w-screen fixed inset-0 z-40">
            {renderImageSection('h-full w-full', true)}
          </div>
        );
      
      case 'map-full':
        return (
          <div className="h-screen w-screen fixed inset-0 z-40">
            {renderMapSection('h-full w-full', true)}
          </div>
        );
      
      default: // 'split'
        return (
          <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 lg:gap-8 min-h-0">
            {renderImageSection('flex-1 min-h-0')}
            {renderMapSection('flex-1 min-h-0')}
          </div>
        );
    }
  };

  return (
    <div className={`${layoutMode === 'split' ? 'fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex flex-col p-4 sm:p-6 lg:p-8' : 'space-y-2 sm:space-y-4'}`}>
      {/* Header - Hide in fullscreen mode */}
      {layoutMode === 'split' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 lg:gap-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:gap-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">🎮 Solo Mode</h1>
            <div className="text-xs sm:text-sm lg:text-base text-blue-300">Click on photo or map to go fullscreen</div>
          </div>
          <Link to="/">
            <Button variant="outline" className="bg-black/50 text-white border-white/30 hover:bg-black/70 hover:text-white hover:border-white/50 w-full sm:w-auto lg:text-lg lg:px-6">
              ← Home
            </Button>
          </Link>
        </div>
      )}

      {/* Game Content */}
      {renderGameContent()}

      {/* Action Zone - Back in normal flow */}
      {layoutMode === 'split' && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4 flex-shrink-0">
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
      )}

      {/* Results Card - Fixed position overlay */}
      {gameState === 'result' && result && layoutMode === 'split' && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl max-w-lg w-full mx-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg sm:text-xl text-center">🎯 Round Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-lg sm:text-xl">📏</div>
                  <div className="text-sm sm:text-base font-semibold">Distance</div>
                  <div className="text-lg sm:text-xl text-blue-300">{result.distance.toLocaleString()} km</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-lg sm:text-xl">🏆</div>
                  <div className="text-sm sm:text-base font-semibold">Score</div>
                  <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300">{getScoreMessage(result.score)}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-lg sm:text-xl">📍</div>
                  <div className="text-sm sm:text-base font-semibold">Actual Location</div>
                  <div className="text-xs sm:text-sm text-gray-300">
                    {currentGame.location || `${result.actualLat.toFixed(2)}, ${result.actualLng.toFixed(2)}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {layoutMode === 'split' && (
        <div className="fixed bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/80 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs backdrop-blur-sm border border-white/20 max-w-xs">
          <div className="text-gray-300 mb-1">Controls:</div>
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
        </div>
      )}
    </div>
  );
} 