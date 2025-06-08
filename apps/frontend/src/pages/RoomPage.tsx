import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            🏠 Room: {roomId}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <p className="text-lg text-blue-200 mb-2">
              Multiplayer Room Interface
            </p>
            <p className="text-sm text-blue-300">
              Real-time gameplay with other players
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-blue-300">
            <p>👥 Player lobby and management</p>
            <p>🖼️ Shared game images</p>
            <p>⚡ Real-time guess submissions</p>
            <p>🏆 Live scoreboard updates</p>
          </div>

          <div className="bg-gray-500/20 rounded-lg p-4 border border-gray-500/30">
            <p className="text-sm text-gray-300 mb-2">Room Features (Phase 4):</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div>• Socket.IO connection</div>
              <div>• Player presence</div>
              <div>• Host controls</div>
              <div>• Round management</div>
            </div>
          </div>

          <div className="pt-4">
            <Link to="/">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                ← Leave Room
              </Button>
            </Link>
          </div>

          <div className="text-xs text-yellow-300 bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
            📋 Phase 4 Implementation: Real-time multiplayer room with Socket.IO
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 