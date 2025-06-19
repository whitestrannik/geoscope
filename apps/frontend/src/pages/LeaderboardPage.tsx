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
    if (rank === 1) return 'text-yellow-600'; // Gold
    if (rank === 2) return 'text-gray-600'; // Silver
    if (rank === 3) return 'text-amber-600'; // Bronze
    if (score >= 4500) return 'text-green-600';
    if (score >= 3000) return 'text-blue-600';
    if (score >= 1500) return 'text-purple-600';
    return 'text-gray-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-500" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
  };

  const isLoading = globalLoading || recentLoading;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-1">
            Compete with players worldwide and track top performers
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/stats')}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          My Stats
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'global'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Global Top
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'recent'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="h-4 w-4" />
          Recent Winners
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600">Loading leaderboard...</div>
        </div>
      )}

      {/* Global Top Tab */}
      {activeTab === 'global' && !globalLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Global Top Players
            </CardTitle>
            <CardDescription>
              Ranked by best score across all game modes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {globalTop && globalTop.length > 0 ? (
              <div className="space-y-2">
                {globalTop.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      index < 3 
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10">
                        {getRankIcon(player.rank)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {player.username}
                        </div>
                        <div className="text-sm text-gray-600">
                          {player.totalGames} games • Avg: {player.avgScore.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(player.bestScore, player.rank)}`}>
                        {player.bestScore.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Best: {formatDistance(player.bestDistance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                No players found. Be the first to set a high score!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Winners Tab */}
      {activeTab === 'recent' && !recentLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Top Performers
            </CardTitle>
            <CardDescription>
              Best individual game scores from the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentWinners && recentWinners.length > 0 ? (
              <div className="space-y-2">
                {recentWinners.map((winner, index) => (
                  <div
                    key={`${winner.id}-${winner.timestamp}`}
                    className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10">
                        {index < 3 ? (
                          <Star className={`h-5 w-5 ${
                            index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-500' : 
                            'text-amber-600'
                          }`} />
                        ) : (
                          <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {winner.username}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            winner.mode === 'solo' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {winner.mode}
                          </span>
                          <Calendar className="h-3 w-3" />
                          {formatDate(winner.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(winner.score, index + 1)}`}>
                        {winner.score.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Distance: {formatDistance(winner.distance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                No recent games found. Start playing to appear here!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      {globalTop && globalTop.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Score</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {globalTop[0]?.bestScore.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                by {globalTop[0]?.username || 'Unknown'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {globalTop.length}
              </div>
              <p className="text-xs text-muted-foreground">
                ranked players
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Distance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatDistance(Math.min(...globalTop.map(p => p.bestDistance)))}
              </div>
              <p className="text-xs text-muted-foreground">
                closest guess
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Call to Action */}
      <Card>
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Think you can make it to the top?
          </h3>
          <p className="text-gray-600 mb-4">
            Play games to improve your ranking and compete with players worldwide!
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
    </div>
  );
};

export { LeaderboardPage }; 