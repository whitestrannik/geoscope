import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { Link } from 'react-router-dom';
import { Loader2, Users, Timer, Hash } from 'lucide-react';

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [totalRounds, setTotalRounds] = useState(5);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [roundTimeLimit, setRoundTimeLimit] = useState(120); // 2 minutes
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [resultsDisplayTime, setResultsDisplayTime] = useState(20);

  const createRoomMutation = trpc.room.create.useMutation({
    onSuccess: (room) => {
      navigate(`/room/${room.id}`);
    },
    onError: (error) => {
      console.error('Failed to create room:', error);
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-lg p-8 text-center space-y-6">
          <div>
            <h1 className="text-2xl font-mono text-cyan-400 mb-2">[ AUTHENTICATION REQUIRED ]</h1>
            <p className="text-gray-300 font-mono">
              {`> Access denied. Login required to create mission.`}
            </p>
          </div>
          <Link to="/">
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-mono shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105">
              [ RETURN TO BASE ]
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug logging
    console.log('🔍 Creating room with user:', user);
    console.log('🔍 User ID:', user?.id);
    
    createRoomMutation.mutate({
      maxPlayers,
      totalRounds,
      roundTimeLimit: hasTimeLimit ? roundTimeLimit : undefined,
      autoAdvance,
      resultsDisplayTime
    });
  };

  return (
    <div className="p-4 py-6 relative">
      <div className="w-full max-w-lg mx-auto relative z-10">
        <div className="bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-lg p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-mono text-cyan-400 mb-2">
              ⚔️ [ CREATE MISSION ]
            </h1>
            <p className="text-gray-300 font-mono text-sm">
              {`> Configure multiplayer session parameters`}
            </p>
          </div>
          
          <form onSubmit={handleCreateRoom} className="space-y-4">
          {/* Max Players */}
          <div className="space-y-2">
            <Label htmlFor="maxPlayers" className="flex items-center gap-2 font-mono text-cyan-300">
              <Users className="h-4 w-4" />
              SQUAD SIZE (2-10)
            </Label>
            <Input
              id="maxPlayers"
              type="number"
              min="2"
              max="10"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 6)}
              className="bg-black/60 backdrop-blur-sm border-cyan-500/50 text-white font-mono focus:border-cyan-400 focus:ring-cyan-400/20"
            />
          </div>

          {/* Total Rounds */}
          <div className="space-y-2">
            <Label htmlFor="totalRounds" className="flex items-center gap-2 font-mono text-cyan-300">
              <Hash className="h-4 w-4" />
              MISSION ROUNDS (1-20)
            </Label>
            <Input
              id="totalRounds"
              type="number"
              min="1"
              max="20"
              value={totalRounds}
              onChange={(e) => setTotalRounds(parseInt(e.target.value) || 5)}
              className="bg-black/60 backdrop-blur-sm border-cyan-500/50 text-white font-mono focus:border-cyan-400 focus:ring-cyan-400/20"
            />
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasTimeLimit"
                checked={hasTimeLimit}
                onChange={(e) => setHasTimeLimit(e.target.checked)}
                className="w-4 h-4 accent-cyan-500"
              />
              <Label htmlFor="hasTimeLimit" className="flex items-center gap-2 font-mono text-cyan-300 text-sm">
                <Timer className="h-4 w-4" />
                ENABLE COUNTDOWN TIMER
              </Label>
            </div>
            
            {hasTimeLimit && (
              <div className="space-y-2 pl-6 border-l-2 border-cyan-500/30">
                <Label htmlFor="roundTimeLimit" className="text-xs font-mono text-gray-300">
                  {`> TIME PER ROUND (30-300 seconds)`}
                </Label>
                <Input
                  id="roundTimeLimit"
                  type="number"
                  min="30"
                  max="300"
                  value={roundTimeLimit}
                  onChange={(e) => setRoundTimeLimit(parseInt(e.target.value) || 120)}
                  className="bg-black/60 backdrop-blur-sm border-cyan-500/50 text-white font-mono focus:border-cyan-400 focus:ring-cyan-400/20 h-8"
                />
              </div>
            )}
          </div>

          {/* Round Progression Mode */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-mono text-cyan-300 text-sm">
              🔄 PROGRESSION MODE
            </Label>
            <div className="space-y-2 pl-6 border-l-2 border-cyan-500/30">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="autoAdvance"
                  name="advanceMode"
                  checked={autoAdvance}
                  onChange={() => setAutoAdvance(true)}
                  className="w-4 h-4 accent-cyan-500"
                />
                <Label htmlFor="autoAdvance" className="text-xs font-mono text-gray-300">
                  ⏱️ AUTO - Rounds advance with countdown
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="manualAdvance"
                  name="advanceMode"
                  checked={!autoAdvance}
                  onChange={() => setAutoAdvance(false)}
                  className="w-4 h-4 accent-cyan-500"
                />
                <Label htmlFor="manualAdvance" className="text-xs font-mono text-gray-300">
                  👑 MANUAL - Host controls progression
                </Label>
              </div>
            </div>
            
            {autoAdvance && (
              <div className="space-y-1 pl-6 border-l-2 border-purple-500/30">
                <Label htmlFor="resultsDisplayTime" className="text-xs font-mono text-purple-300">
                  {`> RESULTS DISPLAY TIME (5-60 seconds)`}
                </Label>
                <Input
                  id="resultsDisplayTime"
                  type="number"
                  min="5"
                  max="60"
                  value={resultsDisplayTime}
                  onChange={(e) => setResultsDisplayTime(parseInt(e.target.value) || 20)}
                  className="bg-black/60 backdrop-blur-sm border-purple-500/50 text-white font-mono focus:border-purple-400 focus:ring-purple-400/20 h-8"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Link to="/" className="flex-1">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-black/50 text-white border-white/30 hover:bg-black/70 font-mono transition-all duration-300 hover:scale-105"
              >
                [ CANCEL ]
              </Button>
            </Link>
            
            <Button
              type="submit"
              disabled={createRoomMutation.isPending}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-mono shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              {createRoomMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  [ INITIALIZING... ]
                </>
              ) : (
                '⚔️ [ DEPLOY MISSION ]'
              )}
            </Button>
          </div>

          {/* Error Display */}
          {createRoomMutation.error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-md text-sm font-mono backdrop-blur-sm">
              <span className="text-red-400">ERROR:</span> Mission deployment failed - {createRoomMutation.error.message}
            </div>
          )}
          </form>
        </div>
      </div>
    </div>
  );
} 