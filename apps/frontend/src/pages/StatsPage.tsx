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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-black/60 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-lg text-gray-300 font-mono">[ ANALYZING COMBAT DATA... ]</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-black/60 backdrop-blur-sm border border-red-500/30 rounded-lg p-8 text-center space-y-6">
          <div className="text-lg text-gray-300 font-mono">[ DATA ACCESS FAILED ]</div>
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
    <div className="min-h-screen">
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

      <div className="max-w-6xl mx-auto p-6 pt-3 space-y-3 relative z-10">
        {/* Header */}
        <div className="bg-black/60 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6">
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
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black/60 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 shadow-lg shadow-blue-500/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium font-mono text-blue-400">GLOBAL RANK</h3>
              <Medal className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-400">#{stats.globalRank}</div>
            <p className="text-xs text-gray-400 font-mono">
              elite operative status
            </p>
          </div>

          <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4 shadow-lg shadow-yellow-500/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium font-mono text-yellow-400">LEGENDARY SCORE</h3>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </div>
            <div className={`text-2xl font-bold font-mono ${getScoreColor(stats.bestScore)}`}>
              {stats.bestScore.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 font-mono">
              maximum efficiency
            </p>
          </div>

          <div className="bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 shadow-lg shadow-purple-500/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium font-mono text-purple-400">MISSIONS COMPLETED</h3>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400">{stats.totalGames}</div>
            <p className="text-xs text-gray-400 font-mono">
              {stats.soloGames} solo • {stats.multiplayerGames} squad
            </p>
          </div>

          <div className="bg-black/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium font-mono text-green-400">PRECISION RECORD</h3>
              <Target className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-green-400">
              {formatDistance(stats.bestDistance)}
            </div>
            <p className="text-xs text-gray-400 font-mono">
              closest target lock
            </p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-black/60 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-xl font-mono text-cyan-400 flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                [ PERFORMANCE METRICS ]
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                {`> Overall mission statistics and combat analysis`}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium font-mono text-gray-300">Average Score</span>
                <span className={`font-bold font-mono ${getScoreColor(stats.avgScore)}`}>
                  {stats.avgScore.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium font-mono text-gray-300">Average Distance</span>
                <span className="font-bold font-mono text-white">
                  {formatDistance(stats.avgDistance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium font-mono text-gray-300">Total Distance Guessed</span>
                <span className="font-bold font-mono text-white">
                  {formatDistance(stats.totalDistance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium font-mono text-gray-300">Games per Mode</span>
                <div className="text-right font-mono">
                  <div className="text-sm text-blue-400">Solo: {stats.soloGames}</div>
                  <div className="text-sm text-green-400">Multiplayer: {stats.multiplayerGames}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-xl font-mono text-purple-400 flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5" />
                [ ACTIVITY TIMELINE ]
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                {`> Mission deployment history and progress tracking`}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium font-mono text-gray-300">First Game</span>
                <span className="font-bold font-mono text-white">
                  {formatDate(stats.firstPlayed)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium font-mono text-gray-300">Last Game</span>
                <span className="font-bold font-mono text-white">
                  {formatDate(stats.lastPlayed)}
                </span>
              </div>
              {stats.totalGames > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium font-mono text-gray-300">Improvement Rate</span>
                  <span className="font-bold font-mono text-blue-400">
                    {stats.bestScore > stats.avgScore 
                      ? `+${Math.round(((stats.bestScore - stats.avgScore) / stats.avgScore) * 100)}%`
                      : 'Keep playing!'
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Games */}
        {stats.recentGames.length > 0 && (
          <div className="bg-black/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-xl font-mono text-green-400 flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5" />
                [ RECENT MISSIONS ]
              </h3>
              <p className="text-gray-400 font-mono text-sm">
                {`> Last ${stats.recentGames.length} combat operations and performance data`}
              </p>
            </div>
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-2 text-gray-300 font-mono">Date</th>
                      <th className="text-left py-2 text-gray-300 font-mono">Mode</th>
                      <th className="text-left py-2 text-gray-300 font-mono">Score</th>
                      <th className="text-left py-2 text-gray-300 font-mono">Distance</th>
                      <th className="text-left py-2 text-gray-300 font-mono">Round</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentGames.map((game, index) => (
                      <tr key={game.id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                        <td className="py-2 text-gray-300 font-mono">
                          {new Date(game.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium font-mono ${
                            game.mode === 'solo' 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                              : 'bg-green-500/20 text-green-300 border border-green-500/40'
                          }`}>
                            {game.mode}
                          </span>
                        </td>
                        <td className={`py-2 font-medium font-mono ${getScoreColor(game.score)}`}>
                          {game.score.toLocaleString()}
                        </td>
                        <td className="py-2 text-gray-300 font-mono">
                          {formatDistance(game.distance)}
                        </td>
                        <td className="py-2 text-gray-400 font-mono">
                          {game.roundIndex !== null ? `#${game.roundIndex + 1}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.totalGames === 0 && (
          <div className="bg-black/60 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-8 text-center">
            <MapPin className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-mono text-cyan-400 mb-2">[ NO MISSIONS ON RECORD ]</h3>
            <p className="text-gray-300 font-mono mb-6">
              {`> Deploy to combat zones to begin tracking performance metrics`}
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => navigate('/solo')}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-mono shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
              >
                🎯 [ SOLO MISSION ]
              </Button>
              <Button 
                onClick={() => navigate('/room/join')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105"
              >
                ⚔️ [ JOIN SQUAD ]
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 