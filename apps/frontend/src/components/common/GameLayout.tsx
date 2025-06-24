import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export type LayoutMode = 'split' | 'image-full' | 'map-full';

interface GameLayoutProps {
  // Layout control
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  
  // Content sections
  imageSection: React.ReactNode;
  mapSection: React.ReactNode;
  actionSection?: React.ReactNode;
  resultsOverlay?: React.ReactNode;
  
  // Header configuration
  title: string;
  subtitle?: string;
  showHomeButton?: boolean;
  headerActions?: React.ReactNode;
  
  // Keyboard shortcuts
  enableKeyboardShortcuts?: boolean;
  onEnterPress?: () => void;
  onNPress?: () => void;
  
  // Help overlay
  showHelpOverlay?: boolean;
  customHelpContent?: React.ReactNode;
  
  // Styling
  className?: string;
}

export function GameLayout({
  layoutMode,
  onLayoutModeChange,
  imageSection,
  mapSection,
  actionSection,
  resultsOverlay,
  title,
  subtitle,
  showHomeButton = true,
  headerActions,
  enableKeyboardShortcuts = true,
  onEnterPress,
  onNPress,
  showHelpOverlay = true,
  customHelpContent,
  className = ""
}: GameLayoutProps) {

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key) {
        case 'f':
        case 'F':
          // Toggle image fullscreen
          onLayoutModeChange(layoutMode === 'image-full' ? 'split' : 'image-full');
          break;
        case 'm':
        case 'M':
          // Toggle map fullscreen
          onLayoutModeChange(layoutMode === 'map-full' ? 'split' : 'map-full');
          break;
        case 'Escape':
          // Exit fullscreen to split view
          if (layoutMode === 'image-full' || layoutMode === 'map-full') {
            onLayoutModeChange('split');
          }
          break;
        case 'Enter':
          if (onEnterPress) {
            onEnterPress();
          }
          break;
        case 'n':
        case 'N':
          if (onNPress) {
            onNPress();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [layoutMode, onLayoutModeChange, enableKeyboardShortcuts, onEnterPress, onNPress]);

  const renderContent = () => {
    switch (layoutMode) {
      case 'image-full':
        return (
          <div className="h-screen w-screen fixed inset-0 z-40">
            {imageSection}
          </div>
        );
      
      case 'map-full':
        return (
          <div className="h-screen w-screen fixed inset-0 z-40">
            {mapSection}
          </div>
        );
      
      default: // 'split'
        return (
          <div className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 lg:gap-8 min-h-0">
            <div className="flex-1 min-h-0">
              {imageSection}
            </div>
            <div className="flex-1 min-h-0">
              {mapSection}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`${layoutMode === 'split' ? 'fixed top-16 left-0 right-0 bottom-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex flex-col p-4 sm:p-6 lg:p-8' : 'space-y-2 sm:space-y-4'} ${className}`}>
      {/* Header - Hide in fullscreen mode */}
      {layoutMode === 'split' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 lg:gap-6 mb-4 bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-lg p-4 shadow-lg shadow-cyan-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:gap-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-400 font-mono flex items-center">
              <span className="mr-2">⚡</span>
              {title}
            </h1>
            {subtitle && (
              <div className="text-xs sm:text-sm lg:text-base text-cyan-300 font-mono bg-cyan-500/20 border border-cyan-400/30 px-3 py-1 rounded">
                &gt; {subtitle}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            {showHomeButton && (
              <Link to="/">
                <Button variant="outline" className="bg-black/60 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400/70 font-mono w-full sm:w-auto lg:text-lg lg:px-6">
                  ← [ HOME ]
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Game Content */}
      {renderContent()}

      {/* Action Section with Integrated Control Panel - Only in split mode */}
      {layoutMode === 'split' && (
        <div className="flex flex-col items-center gap-3 mt-4 flex-shrink-0">
          {/* Action Buttons (Submit, Play Again, etc.) */}
          {actionSection && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
              {actionSection}
            </div>
          )}
          
          {/* Unified Control Panel */}
          {showHelpOverlay && (
            <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 text-cyan-300 px-6 py-3 rounded-lg text-sm shadow-lg shadow-cyan-500/10 hover:border-cyan-400/50 transition-all duration-300">
              {customHelpContent || (
                <div className="flex items-center gap-4 text-center flex-wrap justify-center font-mono">
                  <span className="text-cyan-400">[ COMMAND CENTER ]:</span>
                  <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">Left-click</kbd> Fullscreen</span>
                  <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">Right-click</kbd> Target</span>
                  <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">Scroll</kbd> Zoom</span>
                  <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">Drag</kbd> Pan</span>
                  <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">F</kbd> Photo</span>
                  <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">M</kbd> Map</span>
                  <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">Esc</kbd> Exit</span>
                  {onEnterPress && <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">Enter</kbd> Execute</span>}
                  {onNPress && <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">N</kbd> Next</span>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Overlay - Fixed position overlay */}
      {resultsOverlay && layoutMode === 'split' && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          {resultsOverlay}
        </div>
      )}

      {/* Control Panel for Fullscreen Modes */}
      {layoutMode !== 'split' && showHelpOverlay && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md border border-cyan-500/30 text-cyan-300 px-6 py-3 rounded-lg text-sm shadow-lg shadow-cyan-500/10 z-30">
          {customHelpContent || (
            <div className="flex items-center gap-4 text-center font-mono">
              <span className="text-cyan-400">[ FULLSCREEN MODE ]:</span>
              <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">Esc</kbd> Exit</span>
              <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">Scroll</kbd> Zoom</span>
              <span><kbd className="bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded text-xs">Drag</kbd> Pan</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 