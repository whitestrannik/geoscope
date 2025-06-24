import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function HomePage() {
  return (
    <div className="min-h-[calc(100vh-200px)] relative flex flex-col items-center justify-center">
      {/* Gaming-style Hero Section with Enhanced Visibility */}
      <div className="text-center mb-12 max-w-4xl">
        {/* Hero Container with Strong Background */}
        <div className="bg-black/70 backdrop-blur-md rounded-2xl p-8 border border-cyan-500/30 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-center mb-6">
            <div className="text-6xl animate-pulse mr-4 drop-shadow-lg">🌍</div>
            <h1 className="text-6xl md:text-7xl font-bold text-white font-mono tracking-wider drop-shadow-2xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                GEOSCOPE
              </span>
            </h1>
            <div className="text-4xl animate-pulse ml-4 drop-shadow-lg">⚡</div>
          </div>
          
          <p className="text-xl md:text-2xl text-cyan-300 mb-6 font-mono font-bold drop-shadow-lg">
            &gt; EXPLORE THE WORLD THROUGH REAL PHOTOS
          </p>
          
          <p className="text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed font-mono drop-shadow-md">
            Challenge yourself and friends to identify locations from stunning photographs.<br/>
            Test your geography skills and compete for the highest scores!
          </p>
        </div>
      </div>

      {/* Gaming Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Link to="/solo" className="block group">
          <Card className="bg-black/80 backdrop-blur-sm border-cyan-500/50 text-white shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-400 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 to-blue-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold font-mono flex items-center">
                  <span className="text-cyan-400 mr-3">▶</span>
                  [ SOLO ADVENTURE ]
                </CardTitle>
                <div className="text-2xl animate-pulse opacity-60 group-hover:opacity-100 transition-opacity">
                  🎯
                </div>
              </div>
              <CardDescription className="text-cyan-300 text-base font-mono">
                &gt; Test your geography skills solo
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-gray-300 mb-4 font-mono">Challenge yourself with locations from around the world. Perfect your guessing skills at your own pace.</p>
              <div className="flex items-center text-sm text-cyan-400 font-mono">
                <span className="mr-2">⚡</span>
                Instant play • Unlimited rounds
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/room/create" className="block group">
          <Card className="bg-black/80 backdrop-blur-sm border-purple-500/50 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-105 group-hover:border-purple-400 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold font-mono flex items-center">
                  <span className="text-purple-400 mr-3">⚔</span>
                  [ MULTIPLAYER ]
                </CardTitle>
                <div className="text-2xl animate-pulse opacity-60 group-hover:opacity-100 transition-opacity">
                  👑
                </div>
              </div>
              <CardDescription className="text-purple-300 text-base font-mono">
                &gt; Compete with friends worldwide
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-gray-300 mb-4 font-mono">Create or join rooms to play with friends. Real-time competition with live leaderboards.</p>
              <div className="flex items-center text-sm text-purple-400 font-mono">
                <span className="mr-2">⚡</span>
                Up to 8 players • Real-time
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Gaming Quick Actions - Centered to match main cards grid */}
      <div className="w-full max-w-4xl mt-8">
        {/* Use same grid structure as main cards to ensure perfect center alignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex justify-end">
            <Link 
              to="/room/join" 
              className="bg-black/70 backdrop-blur-md border border-yellow-500/50 text-yellow-400 hover:text-yellow-300 hover:border-yellow-400 transition-all duration-300 px-6 py-3 rounded-lg font-mono font-medium"
            >
              🚪 JOIN ROOM
            </Link>
          </div>
          <div className="flex justify-start">
            <Link 
              to="/leaderboard" 
              className="bg-black/70 backdrop-blur-md border border-green-500/50 text-green-400 hover:text-green-300 hover:border-green-400 transition-all duration-300 px-6 py-3 rounded-lg font-mono font-medium"
            >
              🏆 LEADERBOARD
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 