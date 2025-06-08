import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function SoloPage() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [currentGame, setCurrentGame] = useState<GameData | null>(null);
  const [userGuess, setUserGuess] = useState<GuessData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">🎮 Solo Mode</h1>
        <Link to="/">
          <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
            ← Back to Home
          </Button>
        </Link>
      </div>

      {/* Game Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Image */}
        <div className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl">📍 Where is this photo taken?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative group">
                <img
                  src={currentGame.imageUrl}
                  alt="Mystery location"
                  className="w-full h-64 lg:h-80 object-cover rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => setIsImageModalOpen(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white bg-black/50 px-3 py-1 rounded-full text-sm">
                    🔍 Click to enlarge
                  </span>
                </div>
              </div>
              
              {currentGame.location && (
                <div className="mt-3 text-xs text-blue-300">
                  Hint: This photo is from somewhere around the world
                </div>
              )}
              
              {currentGame.copyright && (
                <div className="mt-2 text-xs text-gray-400">
                  Photo: {currentGame.copyright}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Map and Controls */}
        <div className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl">🗺️ Make your guess</CardTitle>
            </CardHeader>
            <CardContent>
              <MapComponent
                onMarkerPlace={handleMarkerPlace}
                guessMarker={userGuess}
                actualMarker={gameState === 'result' ? { lat: currentGame.actualLat, lng: currentGame.actualLng } : null}
                showResult={gameState === 'result'}
                className="h-64 lg:h-80"
              />
              
              {userGuess && gameState === 'playing' && (
                <div className="mt-4 p-3 bg-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-200">
                    📍 Your guess: {userGuess.lat.toFixed(4)}, {userGuess.lng.toFixed(4)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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
        </div>
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