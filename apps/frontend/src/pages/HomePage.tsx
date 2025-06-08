import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';

export function HomePage() {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-bold mb-2">
            🌍 GeoScope
          </CardTitle>
          <CardDescription className="text-lg text-blue-200">
            Discover the world through real photos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Link to="/solo">
            <Button 
              size="lg" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg transition-all duration-200 hover:scale-105"
            >
              🎮 Play Solo
            </Button>
          </Link>

          <Link to="/room/create">
            <Button 
              size="lg" 
              variant="secondary"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 text-lg transition-all duration-200 hover:scale-105"
            >
              🏠 Create Room
            </Button>
          </Link>

          <Link to="/room/join">
            <Button 
              size="lg" 
              variant="outline"
              className="w-full bg-teal-600 hover:bg-teal-700 border-teal-500 text-white font-semibold py-6 text-lg transition-all duration-200 hover:scale-105"
            >
              🚪 Join Room
            </Button>
          </Link>

          <Link to="/leaderboard">
            <Button 
              size="lg" 
              variant="ghost"
              className="w-full bg-yellow-600/80 hover:bg-yellow-700 text-white font-semibold py-6 text-lg transition-all duration-200 hover:scale-105"
            >
              🏆 Leaderboard
            </Button>
          </Link>
        </CardContent>

        <div className="px-6 pb-6">
          <div className="text-center text-xs text-blue-300 space-y-1 mt-6 pt-4 border-t border-white/20">
            <p>✅ React + TypeScript + Vite</p>
            <p>✅ TailwindCSS v4 + shadcn/ui</p>
            <p>✅ React Router + Navigation</p>
            <button
              onClick={() => setIsImageModalOpen(true)}
              className="text-purple-300 hover:text-purple-200 underline"
            >
              🖼️ Test Image Modal
            </button>
          </div>
        </div>
      </Card>

      {/* Image Viewer Modal Demo */}
      <ImageViewerModal
        src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop"
        alt="Demo landscape image"
        title="Image Viewer Demo"
        description="This modal will be used for viewing game images in fullscreen"
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </div>
  );
} 