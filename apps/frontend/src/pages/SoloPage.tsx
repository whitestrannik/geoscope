import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapComponent } from '@/components/common/MapComponent';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
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

type LayoutMode = 'split' | 'image-focus' | 'map-focus' | 'image-full' | 'map-full';

export function SoloPage() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [currentGame, setCurrentGame] = useState<GameData | null>(null);
  const [userGuess, setUserGuess] = useState<GuessData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [imageSplit, setImageSplit] = useState(50); // Percentage for image side in split mode

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
    setLayoutMode('split'); // Reset to split view for new game
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
            <Button onClick={() => refetchImage()} className="bg-blue-600 hover:bg-blue-700">
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
            <Button onClick={() => refetchImage()} className="bg-blue-600 hover:bg-blue-700">
              Load Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderLayoutControls = () => (
    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg p-2">
      <span className="text-sm text-gray-300 mr-2">Layout:</span>
      <Button
        onClick={() => setLayoutMode('image-full')}
        size="sm"
        variant={layoutMode === 'image-full' ? 'default' : 'outline'}
        className="text-xs h-7"
      >
        📷 Image
      </Button>
      <Button
        onClick={() => setLayoutMode('split')}
        size="sm"
        variant={layoutMode === 'split' ? 'default' : 'outline'}
        className="text-xs h-7"
      >
        ⚡ Split
      </Button>
      <Button
        onClick={() => setLayoutMode('map-full')}
        size="sm"
        variant={layoutMode === 'map-full' ? 'default' : 'outline'}
        className="text-xs h-7"
      >
        🗺️ Map
      </Button>
    </div>
  );

  const renderImageSection = (className: string = '') => (
    <div className={className}>
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📍 Where is this photo taken?</CardTitle>
            <div className="flex items-center gap-2">
              {layoutMode !== 'image-full' && (
                <Button
                  onClick={() => setLayoutMode('image-focus')}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                >
                  🔍 Focus
                </Button>
              )}
              <Button
                onClick={() => setIsImageModalOpen(true)}
                size="sm"
                variant="outline"
                className="text-xs h-7"
              >
                ⛶ Fullscreen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="relative group flex-1 min-h-0">
            <img
              src={currentGame.imageUrl}
              alt="Mystery location"
              className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
              onClick={() => setIsImageModalOpen(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                🔍 Click to enlarge & zoom
              </span>
            </div>
          </div>
          
          <div className="mt-3 space-y-2">
            {currentGame.location && (
              <div className="text-xs text-blue-300">
                Hint: This photo is from somewhere around the world
              </div>
            )}
            
            {currentGame.copyright && (
              <div className="text-xs text-gray-400">
                Photo: {currentGame.copyright}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMapSection = (className: string = '') => (
    <div className={className}>
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">🗺️ Make your guess</CardTitle>
            <div className="flex items-center gap-2">
              {layoutMode !== 'map-full' && (
                <Button
                  onClick={() => setLayoutMode('map-focus')}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                >
                  🔍 Focus
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
          
          {userGuess && gameState === 'playing' && (
            <div className="mt-3 p-2 bg-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-200">
                📍 Your guess: {userGuess.lat.toFixed(4)}, {userGuess.lng.toFixed(4)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderGameContent = () => {
    switch (layoutMode) {
      case 'image-full':
        return (
          <div className="h-[calc(100vh-200px)] flex flex-col">
            {renderImageSection('flex-1')}
          </div>
        );
      
      case 'map-full':
        return (
          <div className="h-[calc(100vh-200px)] flex flex-col">
            {renderMapSection('flex-1')}
          </div>
        );
      
      case 'image-focus':
        return (
          <div className="h-[calc(100vh-200px)] flex gap-4">
            {renderImageSection('flex-[3]')}
            {renderMapSection('flex-[1]')}
          </div>
        );
      
      case 'map-focus':
        return (
          <div className="h-[calc(100vh-200px)] flex gap-4">
            {renderImageSection('flex-[1]')}
            {renderMapSection('flex-[3]')}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">🎮 Solo Mode</h1>
          {renderLayoutControls()}
        </div>
        <Link to="/">
          <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
            ← Back to Home
          </Button>
        </Link>
      </div>

      {/* Game Content */}
      {renderGameContent()}

      {/* Action Button */}
      <div className="text-center">
        {gameState === 'playing' && (
          <Button
            onClick={handleSubmitGuess}
            disabled={!userGuess || evaluateGuessMutation.isPending}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {evaluateGuessMutation.isPending ? '⏳ Calculating...' : '✓ Submit Guess'}
          </Button>
        )}

        {gameState === 'result' && result && (
          <Button
            onClick={handlePlayAgain}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 text-lg transition-all duration-200 hover:scale-105"
          >
            🎮 Play Again
          </Button>
        )}
      </div>

      {/* Results Card */}
      {gameState === 'result' && result && (
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

      {/* Image Modal */}
      <ImageViewerModal
        src={currentGame.imageUrl}
        alt="Mystery location"
        title="Mystery Location"
        description="Study the image carefully to make your best guess!"
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </div>
  );
} 