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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">🔒 Authentication Required</CardTitle>
            <CardDescription className="text-gray-300">
              You need to be logged in to create a room
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/">
              <Button className="w-full">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            🏠 Create Room
          </CardTitle>
          <CardDescription className="text-gray-300">
            Set up a multiplayer game for you and your friends
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleCreateRoom} className="space-y-6">
            {/* Max Players */}
            <div className="space-y-2">
              <Label htmlFor="maxPlayers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Max Players (2-10)
              </Label>
              <Input
                id="maxPlayers"
                type="number"
                min="2"
                max="10"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 6)}
                className="bg-black/20 border-white/30 text-white"
              />
            </div>

            {/* Total Rounds */}
            <div className="space-y-2">
              <Label htmlFor="totalRounds" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Number of Rounds (1-20)
              </Label>
              <Input
                id="totalRounds"
                type="number"
                min="1"
                max="20"
                value={totalRounds}
                onChange={(e) => setTotalRounds(parseInt(e.target.value) || 5)}
                className="bg-black/20 border-white/30 text-white"
              />
            </div>

            {/* Time Limit */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasTimeLimit"
                  checked={hasTimeLimit}
                  onChange={(e) => setHasTimeLimit(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="hasTimeLimit" className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Enable Round Time Limit
                </Label>
              </div>
              
              {hasTimeLimit && (
                <div className="space-y-2">
                  <Label htmlFor="roundTimeLimit" className="text-sm">
                    Time per Round (30-300 seconds)
                  </Label>
                  <Input
                    id="roundTimeLimit"
                    type="number"
                    min="30"
                    max="300"
                    value={roundTimeLimit}
                    onChange={(e) => setRoundTimeLimit(parseInt(e.target.value) || 120)}
                    className="bg-black/20 border-white/30 text-white"
                  />
                </div>
              )}
            </div>

            {/* Round Progression Mode */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                🔄 Round Progression Mode
              </Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="autoAdvance"
                    name="advanceMode"
                    checked={autoAdvance}
                    onChange={() => setAutoAdvance(true)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="autoAdvance" className="text-sm">
                    ⏱️ Automatic - Rounds advance automatically with countdown timer
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="manualAdvance"
                    name="advanceMode"
                    checked={!autoAdvance}
                    onChange={() => setAutoAdvance(false)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="manualAdvance" className="text-sm">
                    👑 Manual - Host controls when to start next round
                  </Label>
                </div>
              </div>
              
              {autoAdvance && (
                <div className="space-y-2">
                  <Label htmlFor="resultsDisplayTime" className="text-sm">
                    Results Display Time (5-60 seconds)
                  </Label>
                  <Input
                    id="resultsDisplayTime"
                    type="number"
                    min="5"
                    max="60"
                    value={resultsDisplayTime}
                    onChange={(e) => setResultsDisplayTime(parseInt(e.target.value) || 20)}
                    className="bg-black/20 border-white/30 text-white"
                  />
                  <p className="text-xs text-gray-400">
                    How long to show results before automatically starting the next round
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Link to="/" className="flex-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-black/50 text-white border-white/30 hover:bg-black/70"
                >
                  Cancel
                </Button>
              </Link>
              
              <Button
                type="submit"
                disabled={createRoomMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {createRoomMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  '🏠 Create Room'
                )}
              </Button>
            </div>

            {/* Error Display */}
            {createRoomMutation.error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-md text-sm">
                Failed to create room: {createRoomMutation.error.message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 