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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="text-2xl">🌍</div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                GeoScope
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex items-center space-x-6">
                <Link
                  to="/"
                  className={`text-sm font-medium transition-colors hover:text-blue-300 ${
                    location.pathname === '/' ? 'text-blue-400' : 'text-white/80'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/solo"
                  className={`text-sm font-medium transition-colors hover:text-blue-300 ${
                    location.pathname === '/solo' ? 'text-blue-400' : 'text-white/80'
                  }`}
                >
                  Solo
                </Link>
                <Link
                  to="/leaderboard"
                  className={`text-sm font-medium transition-colors hover:text-blue-300 ${
                    location.pathname === '/leaderboard' ? 'text-blue-400' : 'text-white/80'
                  }`}
                >
                  Leaderboard
                </Link>
                <Link
                  to="/stats"
                  className={`text-sm font-medium transition-colors hover:text-blue-300 ${
                    location.pathname === '/stats' ? 'text-blue-400' : 'text-white/80'
                  }`}
                >
                  Stats
                </Link>
              </nav>
              
              {/* User Menu */}
              <UserMenu />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-black/90 backdrop-blur-md border-b border-white/10 z-50">
            <nav className="px-4 py-4 space-y-2">
              <Link
                to="/"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 ${
                  location.pathname === '/' ? 'text-blue-400 bg-white/5' : 'text-white/80'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🏠 Home
              </Link>
              <Link
                to="/solo"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 ${
                  location.pathname === '/solo' ? 'text-blue-400 bg-white/5' : 'text-white/80'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🎮 Solo Mode
              </Link>
              <Link
                to="/room/create"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 ${
                  location.pathname === '/room/create' ? 'text-blue-400 bg-white/5' : 'text-white/80'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🏠 Create Room
              </Link>
              <Link
                to="/room/join"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 ${
                  location.pathname === '/room/join' ? 'text-blue-400 bg-white/5' : 'text-white/80'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🚪 Join Room
              </Link>
              <Link
                to="/leaderboard"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 ${
                  location.pathname === '/leaderboard' ? 'text-blue-400 bg-white/5' : 'text-white/80'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🏆 Leaderboard
              </Link>
              <Link
                to="/stats"
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 ${
                  location.pathname === '/stats' ? 'text-blue-400 bg-white/5' : 'text-white/80'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📊 Stats
              </Link>
              
              {/* Mobile User Menu */}
              <div className="pt-2 border-t border-white/10">
                <UserMenu />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
} 