import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    setIsLoading(true);
    // TODO: Implement room validation in Phase 4
    // For now, just navigate to the room
    setTimeout(() => {
      navigate(`/room/${roomCode.trim().toUpperCase()}`);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            🚪 Join Room
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-center text-blue-200">
            Enter the room code to join a multiplayer game
          </p>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-blue-200 mb-2">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit"
              size="lg" 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              disabled={!roomCode.trim() || isLoading}
            >
              {isLoading ? '🔍 Finding Room...' : '🎮 Join Game'}
            </Button>
          </form>

          <div className="text-center">
            <Link to="/">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                ← Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-xs text-yellow-300 bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
            📋 Phase 4 Implementation: Room validation and real-time joining
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 