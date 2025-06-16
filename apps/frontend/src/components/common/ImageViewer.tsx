import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ImageViewerProps {
  imageUrl: string;
  alt: string;
  copyright?: string;
  onFullscreenToggle?: () => void;
  showFullscreenButton?: boolean;
  showZoomControls?: boolean;
  showInstructions?: boolean;
  isFullscreen?: boolean;
  className?: string;
}

export function ImageViewer({
  imageUrl,
  alt,
  copyright,
  onFullscreenToggle,
  showFullscreenButton = true,
  showZoomControls = false,
  showInstructions = true,
  isFullscreen = false,
  className = "w-full h-full"
}: ImageViewerProps) {
  // Image zoom/pan state
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 });
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset zoom/pan when image changes
  useEffect(() => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  }, [imageUrl]);

  // Add native wheel event listener for zoom
  useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      const zoomDelta = e.deltaY < 0 ? 0.2 : -0.2;
      setImageScale(prev => Math.max(0.5, Math.min(4, prev + zoomDelta)));
    };

    imageElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      imageElement.removeEventListener('wheel', handleWheel);
    };
  }, [imageUrl]);

  // Image interaction handlers
  const handleImageClick = (_e: React.MouseEvent) => {
    // Only trigger fullscreen if this was a click, not a drag
    if (!hasMouseMoved && onFullscreenToggle && showFullscreenButton) {
      onFullscreenToggle();
    }
  };

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDraggingImage(true);
      setHasMouseMoved(false);
      setImageDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
      e.preventDefault();
    }
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (isDraggingImage) {
      setHasMouseMoved(true);
      setImagePosition({
        x: e.clientX - imageDragStart.x,
        y: e.clientY - imageDragStart.y
      });
    }
  };

  const handleImageMouseUp = (e: React.MouseEvent) => {
    if (isDraggingImage) {
      setIsDraggingImage(false);
      // Small delay to handle click vs drag distinction
      setTimeout(() => {
        if (!hasMouseMoved && onFullscreenToggle && showFullscreenButton) {
          handleImageClick(e);
        }
        setHasMouseMoved(false);
      }, 10);
    }
  };

  const handleZoomIn = () => {
    setImageScale(prev => Math.min(4, prev + 0.3));
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(0.5, prev - 0.3));
  };

  const handleResetZoom = () => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  return (
    <div className={`relative group overflow-hidden select-none ${className}`}>
      {/* Main Image */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-contain transition-transform duration-75"
        style={{
          transform: showZoomControls 
            ? `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageScale})`
            : `scale(${imageScale}) translate(${imagePosition.x / imageScale}px, ${imagePosition.y / imageScale}px)`,
          transformOrigin: showZoomControls ? 'center center' : 'center center',
          cursor: isDraggingImage ? 'grabbing' : (imageScale > 1 ? 'grab' : (showFullscreenButton ? 'pointer' : 'default'))
        }}
        onMouseDown={handleImageMouseDown}
        onMouseMove={handleImageMouseMove}
        onMouseUp={handleImageMouseUp}
        onMouseLeave={handleImageMouseUp}
        draggable={false}
      />

      {/* Zoom Controls (for multiplayer style) */}
      {showZoomControls && (
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-black/80 border-white/30 text-white hover:bg-black/90"
            onClick={handleZoomIn}
          >
            +
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-black/80 border-white/30 text-white hover:bg-black/90"
            onClick={handleZoomOut}
          >
            -
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-black/80 border-white/30 text-white hover:bg-black/90 text-xs"
            onClick={handleResetZoom}
          >
            Reset
          </Button>
        </div>
      )}

      {/* Zoom Percentage Indicator */}
      {imageScale !== 1 && (
        <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono">
          {Math.round(imageScale * 100)}%
        </div>
      )}

      {/* Interactive Overlay (for solo style) */}
      {showFullscreenButton && !showZoomControls && (
        <div 
          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none"
        >
          <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
            {isFullscreen ? '↩️ Back to split view' : '⛶ Go fullscreen'}
          </div>
        </div>
      )}

      {/* Instructions */}
      {showInstructions && !isDraggingImage && (
        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {imageScale === 1 
            ? (showFullscreenButton ? 'Click: fullscreen • Scroll: zoom' : 'Scroll: zoom • Drag: pan')
            : 'Drag: pan • Scroll: zoom'
          }
        </div>
      )}

      {/* Copyright */}
      {copyright && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          📸 {copyright}
        </div>
      )}

      {/* Back Button (for fullscreen mode) */}
      {isFullscreen && onFullscreenToggle && (
        <div className="absolute top-3 left-3">
          <Button
            onClick={onFullscreenToggle}
            size="sm"
            variant="outline"
            className="bg-black/50 text-white border-white/30 hover:bg-black/70 hover:text-white hover:border-white/50"
            title="Back to split view (Press Esc)"
          >
            ← Back
          </Button>
        </div>
      )}
    </div>
  );
} 