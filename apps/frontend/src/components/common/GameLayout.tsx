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
    <div className={`${layoutMode === 'split' ? 'fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex flex-col p-4 sm:p-6 lg:p-8' : 'space-y-2 sm:space-y-4'} ${className}`}>
      {/* Header - Hide in fullscreen mode */}
      {layoutMode === 'split' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 lg:gap-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:gap-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{title}</h1>
            {subtitle && (
              <div className="text-xs sm:text-sm lg:text-base text-blue-300">{subtitle}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            {showHomeButton && (
              <Link to="/">
                <Button variant="outline" className="bg-black/50 text-white border-white/30 hover:bg-black/70 hover:text-white hover:border-white/50 w-full sm:w-auto lg:text-lg lg:px-6">
                  ← Home
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Game Content */}
      {renderContent()}

      {/* Action Section - Only in split mode */}
      {layoutMode === 'split' && actionSection && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4 flex-shrink-0">
          {actionSection}
        </div>
      )}

      {/* Results Overlay - Fixed position overlay */}
      {resultsOverlay && layoutMode === 'split' && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          {resultsOverlay}
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {layoutMode === 'split' && showHelpOverlay && (
        <div className="fixed bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/80 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs backdrop-blur-sm border border-white/20 max-w-xs">
          {customHelpContent || (
            <>
              <div className="text-gray-300 mb-1">Controls:</div>
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  <span><kbd className="bg-white/20 px-1 rounded">Click</kbd> Fullscreen</span>
                  <span><kbd className="bg-white/20 px-1 rounded">Scroll</kbd> Zoom</span>
                  <span><kbd className="bg-white/20 px-1 rounded">Drag</kbd> Pan</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span><kbd className="bg-white/20 px-1 rounded">F</kbd> Photo</span>
                  <span><kbd className="bg-white/20 px-1 rounded">M</kbd> Map</span>
                  <span><kbd className="bg-white/20 px-1 rounded">Esc</kbd> Exit</span>
                  {onEnterPress && <span><kbd className="bg-white/20 px-1 rounded">Enter</kbd> Submit</span>}
                  {onNPress && <span><kbd className="bg-white/20 px-1 rounded">N</kbd> Next</span>}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 