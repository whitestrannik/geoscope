import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { trpc } from '../lib/trpc';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Medal, Target, Users, Calendar, TrendingUp, Star } from 'lucide-react';

type TabType = 'global' | 'recent';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('global');

  const { data: globalTop, isLoading: globalLoading } = trpc.leaderboard.getGlobalTop.useQuery({
    limit: 20,
    mode: 'all'
  });

  const { data: recentWinners, isLoading: recentLoading } = trpc.leaderboard.getRecentWinners.useQuery({
    limit: 15,
    hours: 24
  });

  const formatDistance = (kilometers: number) => {
    if (kilometers >= 1) {
      return `${kilometers.toFixed(1)} km`;
    }
    return `${Math.round(kilometers * 1000)} m`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number, rank?: number) => {
    if (rank === 1) return 'text-yellow-400'; // Gold
    if (rank === 2) return 'text-gray-300'; // Silver
    if (rank === 3) return 'text-amber-400'; // Bronze
    if (score >= 4500) return 'text-green-400';
    if (score >= 3000) return 'text-blue-400';
    if (score >= 1500) return 'text-purple-400';
    return 'text-gray-400';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-400" />;
    return <span className="text-lg font-bold font-mono text-cyan-400">#{rank}</span>;
  };

  const isLoading = globalLoading || recentLoading;

  return (
    <div className="min-h-screen">
      {/* Gaming Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-500/10 animate-pulse"
            style={{
              width: `${Math.random() * 80 + 30}px`,
              height: `${Math.random() * 80 + 30}px`,
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
              [ GLOBAL RANKINGS ]
            </h1>
            <p className="text-gray-300 font-mono">
              {`> Elite operatives worldwide • Real-time combat statistics`}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/stats')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-mono shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            [ MY STATS ]
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-black/60 backdrop-blur-sm p-1 rounded-lg border border-cyan-500/30">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-mono font-medium transition-all duration-300 ${
              activeTab === 'global'
                ? 'bg-gradient-to-r from-cyan-600/80 to-blue-600/80 text-white shadow-lg shadow-cyan-500/20'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="h-4 w-4" />
            [ HALL OF FAME ]
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-mono font-medium transition-all duration-300 ${
              activeTab === 'recent'
                ? 'bg-gradient-to-r from-cyan-600/80 to-blue-600/80 text-white shadow-lg shadow-cyan-500/20'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clock className="h-4 w-4" />
            [ RECENT VICTORIES ]
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
              <div className="text-lg text-gray-300 font-mono">[ ACCESSING DATABASE... ]</div>
            </div>
          </div>
        )}

        {/* Global Top Tab */}
        {activeTab === 'global' && !globalLoading && (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-mono text-cyan-400 mb-2">
                <Trophy className="inline h-6 w-6 mr-2" />
                ELITE OPERATIVES
              </h2>
              <p className="text-gray-300 font-mono">
                {`> Ranked by maximum mission score across all operations`}
              </p>
            </div>

            {globalTop && globalTop.length > 0 ? (
              <div className="space-y-2">
                {globalTop.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm ${
                      index < 3 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/40 shadow-lg shadow-yellow-500/10' 
                        : 'bg-gray-900/60 hover:bg-gray-800/80 border-cyan-500/20 hover:border-cyan-400/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-black/50 rounded-lg border border-cyan-500/30">
                        {getRankIcon(player.rank)}
                      </div>
                      <div>
                        <div className="font-bold font-mono text-white text-lg">
                          {player.username}
                        </div>
                        <div className="text-sm text-gray-400 font-mono">
                          {player.totalGames} missions • AVG: {player.avgScore.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold font-mono ${getScoreColor(player.bestScore, player.rank)}`}>
                        {player.bestScore.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400 font-mono">
                        BEST: {formatDistance(player.bestDistance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 font-mono">
                <Target className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <div className="text-xl mb-2">[ NO OPERATIVES FOUND ]</div>
                <div>Be the first to set a legendary score!</div>
              </div>
            )}
          </div>
        )}

        {/* Recent Winners Tab */}
        {activeTab === 'recent' && !recentLoading && (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-mono text-cyan-400 mb-2">
                <Clock className="inline h-6 w-6 mr-2" />
                RECENT VICTORIES
              </h2>
              <p className="text-gray-300 font-mono">
                {`> Top mission scores from the last 24 hours`}
              </p>
            </div>

            {recentWinners && recentWinners.length > 0 ? (
              <div className="space-y-2">
                {recentWinners.map((winner, index) => (
                  <div
                    key={`${winner.id}-${winner.timestamp}`}
                    className="flex items-center justify-between p-4 rounded-lg border bg-gray-900/60 hover:bg-gray-800/80 border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-black/50 rounded-lg border border-cyan-500/30">
                        {index < 3 ? (
                          <Star className={`h-5 w-5 ${
                            index === 0 ? 'text-yellow-400' : 
                            index === 1 ? 'text-gray-300' : 
                            'text-amber-400'
                          }`} />
                        ) : (
                          <span className="text-lg font-bold font-mono text-cyan-400">#{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold font-mono text-white text-lg">
                          {winner.username}
                        </div>
                        <div className="text-sm text-gray-400 font-mono flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            winner.mode === 'solo' 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}>
                            {winner.mode.toUpperCase()}
                          </span>
                          <Calendar className="h-3 w-3" />
                          {formatDate(winner.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold font-mono ${getScoreColor(winner.score, index + 1)}`}>
                        {winner.score.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400 font-mono">
                        DIST: {formatDistance(winner.distance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 font-mono">
                <Clock className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <div className="text-xl mb-2">[ NO RECENT ACTIVITY ]</div>
                <div>Start playing to appear in victory logs!</div>
              </div>
            )}
          </div>
        )}

        {/* Stats Summary */}
        {globalTop && globalTop.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4 shadow-lg shadow-yellow-500/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium font-mono text-yellow-400">LEGENDARY SCORE</h3>
                <Trophy className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-yellow-400">
                {globalTop[0]?.bestScore.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-gray-400 font-mono">
                by {globalTop[0]?.username || 'Unknown'}
              </p>
            </div>

            <div className="bg-black/60 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 shadow-lg shadow-blue-500/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium font-mono text-blue-400">ACTIVE OPERATIVES</h3>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-400">
                {globalTop.length}
              </div>
              <p className="text-xs text-gray-400 font-mono">
                ranked operatives
              </p>
            </div>

            <div className="bg-black/60 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 shadow-lg shadow-green-500/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium font-mono text-green-400">PRECISION RECORD</h3>
                <Target className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-green-400">
                {formatDistance(Math.min(...globalTop.map(p => p.bestDistance)))}
              </div>
              <p className="text-xs text-gray-400 font-mono">
                closest target lock
              </p>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-900/60 to-blue-900/60 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-2xl shadow-purple-500/20 text-center py-8 px-6">
          <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-6 animate-pulse" />
          <h3 className="text-2xl font-bold font-mono text-cyan-400 mb-2">
            [ READY FOR GLORY? ]
          </h3>
          <p className="text-gray-300 font-mono mb-6">
            {`> Deploy into combat zones • Climb the rankings • Achieve legendary status`}
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
      </div>
    </div>
  );
};

export { LeaderboardPage }; 