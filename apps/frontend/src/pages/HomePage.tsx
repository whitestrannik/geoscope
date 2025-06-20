import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function HomePage() {

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
      </Card>
    </div>
  );
} 