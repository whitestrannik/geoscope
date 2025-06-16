
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LeaderboardPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            🏆 Leaderboard
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <p className="text-lg text-blue-200">
            View top players and global rankings!
          </p>
          
          <div className="space-y-2 text-sm text-blue-300">
            <p>📊 Global rankings</p>
            <p>🎯 Top scores</p>
            <p>📈 Player statistics</p>
          </div>

          <div className="pt-4">
            <Link to="/">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                ← Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-xs text-yellow-300 bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
            📋 Future Implementation: User statistics and rankings system
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 