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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">🔒 Authentication Required</CardTitle>
            <CardDescription className="text-gray-300">
              You need to be logged in to join a room
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            🚪 Join Room
          </CardTitle>
          <CardDescription className="text-gray-300">
            Enter a room code to join a multiplayer game
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleJoinRoom} className="space-y-6">
            {/* Room Code Input */}
            <div className="space-y-2">
              <Label htmlFor="roomCode" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Room Code
              </Label>
              <Input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="bg-black/20 border-white/30 text-white text-center text-lg font-mono tracking-widest"
                autoFocus
              />
              <p className="text-xs text-gray-400 text-center">
                Room codes are 6 characters long (e.g., ABC123)
              </p>
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
                disabled={joinRoomMutation.isPending || !roomCode.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {joinRoomMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <DoorOpen className="mr-2 h-4 w-4" />
                    Join Room
                  </>
                )}
              </Button>
            </div>

            {/* Error Display */}
            {joinRoomMutation.error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-md text-sm">
                Failed to join room: {joinRoomMutation.error.message}
              </div>
            )}

            {/* Help Text */}
            <div className="text-center text-sm text-gray-400 space-y-2">
              <p>💡 Ask the room host for the 6-character room code</p>
              <p>🎮 You'll be redirected to the game lobby once joined</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 