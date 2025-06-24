import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';

interface AppShellProps {
  children?: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Video Background */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onLoadedData={(e) => {
            // Set slower playback rate for smoother, more cinematic effect
            const video = e.target as HTMLVideoElement;
            video.playbackRate = 0.7; // 70% of normal speed
          }}
          onError={(e) => {
            // Fallback to CSS background if video fails to load
            const target = e.target as HTMLVideoElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        >
          <source src="/Background3.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Fallback animated background (hidden by default) */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/80 to-purple-900/60" style={{ display: 'none' }}>
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full opacity-20 animate-pulse"
                style={{
                  width: `${Math.random() * 200 + 50}px`,
                  height: `${Math.random() * 200 + 50}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: `radial-gradient(circle, ${
                    ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'][Math.floor(Math.random() * 4)]
                  }40, transparent)`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Gaming overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30"></div>
      </div>

      {/* Game-style Header */}
      <header className="relative z-50 bg-black/40 backdrop-blur-sm border-b border-cyan-500/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Gaming Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="text-3xl animate-pulse">🌍</div>
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-lg group-hover:bg-cyan-400/40 transition-all duration-300"></div>
              </div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 tracking-wider font-mono">
                GEOSCOPE
              </h1>
            </Link>

            {/* Gaming-style Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <nav className="flex items-center space-x-1 bg-black/70 backdrop-blur-md rounded-lg px-4 py-2 border border-cyan-500/30">
                <Link
                  to="/"
                  className={`px-4 py-2 text-sm font-mono font-medium transition-all duration-300 rounded ${
                    location.pathname === '/' 
                      ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/25' 
                      : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                  }`}
                >
                  [ HOME ]
                </Link>
                <Link
                  to="/solo"
                  className={`px-4 py-2 text-sm font-mono font-medium transition-all duration-300 rounded ${
                    location.pathname === '/solo' 
                      ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/25' 
                      : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                  }`}
                >
                  [ SOLO ]
                </Link>
                <Link
                  to="/room/create"
                  className={`px-4 py-2 text-sm font-mono font-medium transition-all duration-300 rounded ${
                    location.pathname.startsWith('/room') 
                      ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/25' 
                      : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                  }`}
                >
                  [ MULTIPLAYER ]
                </Link>
                <Link
                  to="/leaderboard"
                  className={`px-4 py-2 text-sm font-mono font-medium transition-all duration-300 rounded ${
                    location.pathname === '/leaderboard' 
                      ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/25' 
                      : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                  }`}
                >
                  [ LEADERBOARD ]
                </Link>
                <Link
                  to="/stats"
                  className={`px-4 py-2 text-sm font-mono font-medium transition-all duration-300 rounded ${
                    location.pathname === '/stats' 
                      ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/25' 
                      : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                  }`}
                >
                  [ STATS ]
                </Link>
              </nav>
              
              {/* Gaming-style User Menu */}
              <div className="ml-4">
                <UserMenu />
              </div>
            </div>

            {/* Gaming-style Mobile menu button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-cyan-400 border border-cyan-500/50 bg-black/60 hover:bg-cyan-500/20"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Gaming-style Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-black/90 backdrop-blur-md border-b border-cyan-500/30 z-50">
            <nav className="px-4 py-4 space-y-2">
              <Link
                to="/"
                className={`block px-4 py-3 rounded text-sm font-mono font-medium transition-all duration-300 ${
                  location.pathname === '/' 
                    ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50' 
                    : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                [ HOME ]
              </Link>
              <Link
                to="/solo"
                className={`block px-4 py-3 rounded text-sm font-mono font-medium transition-all duration-300 ${
                  location.pathname === '/solo' 
                    ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50' 
                    : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                [ SOLO MODE ]
              </Link>
              <Link
                to="/room/create"
                className={`block px-4 py-3 rounded text-sm font-mono font-medium transition-all duration-300 ${
                  location.pathname === '/room/create' 
                    ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50' 
                    : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                [ CREATE ROOM ]
              </Link>
              <Link
                to="/room/join"
                className={`block px-4 py-3 rounded text-sm font-mono font-medium transition-all duration-300 ${
                  location.pathname === '/room/join' 
                    ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50' 
                    : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                [ JOIN ROOM ]
              </Link>
              <Link
                to="/leaderboard"
                className={`block px-4 py-3 rounded text-sm font-mono font-medium transition-all duration-300 ${
                  location.pathname === '/leaderboard' 
                    ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50' 
                    : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                [ LEADERBOARD ]
              </Link>
              <Link
                to="/stats"
                className={`block px-4 py-3 rounded text-sm font-mono font-medium transition-all duration-300 ${
                  location.pathname === '/stats' 
                    ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/50' 
                    : 'text-gray-300 hover:text-cyan-300 hover:bg-white/10'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                [ STATS ]
              </Link>
              
              {/* Mobile User Menu */}
              <div className="pt-2 border-t border-cyan-500/30">
                <UserMenu />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Gaming-style Main Content */}
      <main className="relative z-10 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
} 