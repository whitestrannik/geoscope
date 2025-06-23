import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { Link } from 'react-router-dom';
import { Loader2, DoorOpen, Hash } from 'lucide-react';

export function JoinRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState('');

  const joinRoomMutation = trpc.room.join.useMutation({
    onSuccess: (room) => {
      navigate(`/room/${room?.id}`);
    },
    onError: (error) => {
      console.error('Failed to join room:', error);
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-black/60 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-8 text-center space-y-6">
          <div>
            <h1 className="text-2xl font-mono text-cyan-400 mb-2">[ AUTHENTICATION REQUIRED ]</h1>
            <p className="text-gray-300 font-mono">
              {`> Access denied. Login required to join squad.`}
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

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      return;
    }

    joinRoomMutation.mutate({
      roomId: roomCode.trim().toUpperCase()
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Gaming Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-500/10 animate-pulse"
            style={{
              width: `${Math.random() * 80 + 40}px`,
              height: `${Math.random() * 80 + 40}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-mono text-purple-400 mb-2">
            🚪 [ JOIN SQUAD ]
          </h1>
          <p className="text-gray-300 font-mono">
            {`> Enter mission access code to join active squad`}
          </p>
        </div>
        
        <form onSubmit={handleJoinRoom} className="space-y-6">
          {/* Room Code Input */}
          <div className="space-y-2">
            <Label htmlFor="roomCode" className="flex items-center gap-2 font-mono text-purple-300">
              <Hash className="h-4 w-4" />
              MISSION ACCESS CODE
            </Label>
            <Input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              className="bg-black/60 backdrop-blur-sm border-purple-500/50 text-white text-center text-xl font-mono tracking-[0.3em] focus:border-purple-400 focus:ring-purple-400/20 h-14"
              autoFocus
            />
            <p className="text-xs text-gray-400 font-mono text-center">
              // 6-character alphanumeric code (e.g., ABC123)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
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
              disabled={joinRoomMutation.isPending || !roomCode.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              {joinRoomMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  [ CONNECTING... ]
                </>
              ) : (
                <>
                  <DoorOpen className="mr-2 h-4 w-4" />
                  [ INFILTRATE ]
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {joinRoomMutation.error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-md text-sm font-mono backdrop-blur-sm">
              <span className="text-red-400">ERROR:</span> Squad infiltration failed - {joinRoomMutation.error.message}
            </div>
          )}

          {/* Help Text */}
          <div className="text-center text-sm text-gray-400 font-mono space-y-2 pt-2">
            <p>💡 Request access code from squad leader</p>
            <p>🎮 Auto-deploy to mission briefing upon access</p>
          </div>
        </form>
      </div>
    </div>
  );
} 