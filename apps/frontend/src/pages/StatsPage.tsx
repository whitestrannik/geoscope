import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { trpc } from '../lib/trpc';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Trophy, Target, MapPin, Clock, TrendingUp, Medal, Calendar, BarChart3 } from 'lucide-react';

export function StatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading } = trpc.leaderboard.getPersonalStats.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <div className="text-lg text-gray-300 font-mono">[ ANALYZING COMBAT DATA... ]</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center py-8">
          <div className="text-lg text-gray-300 font-mono mb-4">[ DATA ACCESS FAILED ]</div>
          <Button 
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-mono shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
          >
            [ RETURN TO BASE ]
          </Button>
        </div>
      </div>
    );
  }

  const formatDistance = (kilometers: number) => {
    if (kilometers >= 1) {
      return `${kilometers.toFixed(1)} km`;
    }
    return `${Math.round(kilometers * 1000)} m`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 4500) return 'text-green-400';
    if (score >= 3000) return 'text-blue-400';
    if (score >= 1500) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Gaming Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-500/10 animate-pulse"
            style={{
              width: `${Math.random() * 60 + 20}px`,
              height: `${Math.random() * 60 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold font-mono text-cyan-400 mb-2">
              [ OPERATIVE PROFILE ]
            </h1>
            <p className="text-gray-300 font-mono">
              {`> Mission performance analysis • Combat effectiveness metrics`}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/leaderboard')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-mono shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105"
          >
            <Trophy className="h-4 w-4 mr-2" />
            [ VIEW RANKINGS ]
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-black/80 backdrop-blur-md border-blue-500/30 shadow-lg shadow-blue-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mono text-blue-400">GLOBAL RANK</CardTitle>
              <Medal className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-blue-400">#{stats.globalRank}</div>
              <p className="text-xs text-gray-400 font-mono">
                elite operative status
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/80 backdrop-blur-md border-yellow-500/30 shadow-lg shadow-yellow-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mono text-yellow-400">LEGENDARY SCORE</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${getScoreColor(stats.bestScore)}`}>
                {stats.bestScore.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 font-mono">
                maximum efficiency
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/80 backdrop-blur-md border-purple-500/30 shadow-lg shadow-purple-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mono text-purple-400">MISSIONS COMPLETED</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-purple-400">{stats.totalGames}</div>
              <p className="text-xs text-gray-400 font-mono">
                {stats.soloGames} solo • {stats.multiplayerGames} squad
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/80 backdrop-blur-md border-green-500/30 shadow-lg shadow-green-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-mono text-green-400">PRECISION RECORD</CardTitle>
              <Target className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-green-400">
                {formatDistance(stats.bestDistance)}
              </div>
              <p className="text-xs text-gray-400 font-mono">
                closest target lock
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Your overall game statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Score</span>
                <span className={`font-bold ${getScoreColor(stats.avgScore)}`}>
                  {stats.avgScore.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Distance</span>
                <span className="font-bold">
                  {formatDistance(stats.avgDistance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Distance Guessed</span>
                <span className="font-bold">
                  {formatDistance(stats.totalDistance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Games per Mode</span>
                <div className="text-right">
                  <div className="text-sm">Solo: {stats.soloGames}</div>
                  <div className="text-sm">Multiplayer: {stats.multiplayerGames}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
              <CardDescription>Your GeoScope journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">First Game</span>
                <span className="font-bold">
                  {formatDate(stats.firstPlayed)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Last Game</span>
                <span className="font-bold">
                  {formatDate(stats.lastPlayed)}
                </span>
              </div>
              {stats.totalGames > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Improvement Rate</span>
                  <span className="font-bold text-blue-600">
                    {stats.bestScore > stats.avgScore 
                      ? `+${Math.round(((stats.bestScore - stats.avgScore) / stats.avgScore) * 100)}%`
                      : 'Keep playing!'
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Games */}
        {stats.recentGames.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Games
              </CardTitle>
              <CardDescription>Your last {stats.recentGames.length} games</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Mode</th>
                      <th className="text-left py-2">Score</th>
                      <th className="text-left py-2">Distance</th>
                      <th className="text-left py-2">Round</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentGames.map((game, index) => (
                      <tr key={game.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">
                          {new Date(game.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            game.mode === 'solo' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {game.mode}
                          </span>
                        </td>
                        <td className={`py-2 font-medium ${getScoreColor(game.score)}`}>
                          {game.score.toLocaleString()}
                        </td>
                        <td className="py-2">
                          {formatDistance(game.distance)}
                        </td>
                        <td className="py-2 text-gray-600">
                          {game.roundIndex !== null ? `#${game.roundIndex + 1}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {stats.totalGames === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No games played yet</h3>
              <p className="text-gray-600 mb-4">
                Start playing to see your statistics and track your progress!
              </p>
              <div className="space-x-4">
                <Button onClick={() => navigate('/solo')}>
                  Play Solo
                </Button>
                <Button variant="outline" onClick={() => navigate('/room/join')}>
                  Join Multiplayer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 