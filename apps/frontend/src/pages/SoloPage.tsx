import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SoloPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            🎮 Solo Mode
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <p className="text-lg text-blue-200">
            Single-player geography guessing game coming soon!
          </p>
          
          <div className="space-y-2 text-sm text-blue-300">
            <p>🖼️ View real-world photos</p>
            <p>🗺️ Guess the location on a map</p>
            <p>🎯 Score points based on accuracy</p>
          </div>

          <div className="pt-4">
            <Link to="/">
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
                ← Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-xs text-yellow-300 bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/30">
            📋 Phase 2 Implementation: Solo gameplay with image API integration
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 