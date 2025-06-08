import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImageViewerModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function ImageViewerModal({ 
  src, 
  alt, 
  isOpen, 
  onClose, 
  title = "Image Viewer",
  description 
}: ImageViewerModalProps) {
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setImageScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setImageScale(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageScale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && imageScale > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case '0':
        handleResetZoom();
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] bg-black/90 border-white/20 text-white overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold text-center">
            {title}
          </DialogTitle>
          {description && (
            <p className="text-sm text-gray-300 text-center">{description}</p>
          )}
        </DialogHeader>

        {/* Image Container */}
        <div 
          className="relative flex-1 overflow-hidden rounded-lg bg-gray-900 flex items-center justify-center min-h-[400px] cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
            style={{
              transform: `scale(${imageScale}) translate(${imagePosition.x / imageScale}px, ${imagePosition.y / imageScale}px)`,
              cursor: imageScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            draggable={false}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
            disabled={imageScale <= 0.5}
          >
            🔍−
          </button>
          
          <span className="text-sm text-gray-300 min-w-[60px] text-center">
            {Math.round(imageScale * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
            disabled={imageScale >= 3}
          >
            🔍+
          </button>
          
          <button
            onClick={handleResetZoom}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
          >
            ↻ Reset
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-gray-400 text-center pt-2 border-t border-white/10">
          <p>Keyboard: <kbd className="bg-white/10 px-1 rounded">+/-</kbd> zoom • <kbd className="bg-white/10 px-1 rounded">0</kbd> reset • <kbd className="bg-white/10 px-1 rounded">Esc</kbd> close</p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 