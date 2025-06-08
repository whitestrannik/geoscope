import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapComponentProps {
  onMarkerPlace?: (lat: number, lng: number) => void;
  guessMarker?: { lat: number; lng: number } | null;
  actualMarker?: { lat: number; lng: number } | null;
  showResult?: boolean;
  className?: string;
}

export function MapComponent({ 
  onMarkerPlace, 
  guessMarker, 
  actualMarker, 
  showResult = false,
  className = "w-full h-96"
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const guessMarkerRef = useRef<maplibregl.Marker | null>(null);
  const actualMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<string>('');

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Simplified map style for better performance and clarity
    const mapStyle = {
      "version": 8 as const,
      "name": "Clean World Map",
      "sources": {
        "raster-tiles": {
          "type": "raster" as const,
          "tiles": [
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          ],
          "tileSize": 256,
          "attribution": "© OpenStreetMap contributors"
        }
      },
      "layers": [
        {
          "id": "raster-layer",
          "source": "raster-tiles",
          "type": "raster" as const,
          "paint": {
            "raster-opacity": 1
          }
        }
      ]
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [0, 20],
      zoom: 2,
      attributionControl: false,
      maxZoom: 18
    });

    // Essential controls only
    map.current.addControl(new maplibregl.NavigationControl({
      showZoom: true,
      showCompass: false,
      visualizePitch: false
    }), 'top-right');

    map.current.addControl(new maplibregl.AttributionControl({
      compact: true
    }), 'bottom-right');

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    // Click handler for placing guesses
    map.current.on('click', (e) => {
      if (!showResult && onMarkerPlace) {
        const { lat, lng } = e.lngLat;
        onMarkerPlace(lat, lng);
      }
    });

    // Simplified coordinate tracking
    map.current.on('mousemove', (e) => {
      const { lat, lng } = e.lngLat;
      setCurrentCoords(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
    });

    map.current.on('mouseleave', () => {
      setCurrentCoords('');
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update guess marker
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing guess marker
    if (guessMarkerRef.current) {
      guessMarkerRef.current.remove();
      guessMarkerRef.current = null;
    }

    // Add new guess marker if provided
    if (guessMarker) {
      const guessEl = document.createElement('div');
      guessEl.innerHTML = `
        <div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform">
          ✓
        </div>
      `;
      guessEl.title = `Your guess: ${guessMarker.lat.toFixed(3)}, ${guessMarker.lng.toFixed(3)}`;

      guessMarkerRef.current = new maplibregl.Marker({
        element: guessEl,
        anchor: 'center'
      })
        .setLngLat([guessMarker.lng, guessMarker.lat])
        .addTo(map.current);
    }
  }, [guessMarker, isMapLoaded]);

  // Update actual marker (only shown in results)
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing actual marker
    if (actualMarkerRef.current) {
      actualMarkerRef.current.remove();
      actualMarkerRef.current = null;
    }

    // Add actual marker if provided and showing results
    if (actualMarker && showResult) {
      const actualEl = document.createElement('div');
      actualEl.innerHTML = `
        <div class="w-6 h-6 bg-red-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white text-xs cursor-pointer hover:scale-110 transition-transform">
          📍
        </div>
      `;
      actualEl.title = `Actual location: ${actualMarker.lat.toFixed(3)}, ${actualMarker.lng.toFixed(3)}`;

      actualMarkerRef.current = new maplibregl.Marker({
        element: actualEl,
        anchor: 'center'
      })
        .setLngLat([actualMarker.lng, actualMarker.lat])
        .addTo(map.current);

      // Smart bounds fitting
      if (guessMarker) {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([guessMarker.lng, guessMarker.lat]);
        bounds.extend([actualMarker.lng, actualMarker.lat]);
        
        map.current.fitBounds(bounds, {
          padding: 60,
          maxZoom: 8
        });
      }
    }
  }, [actualMarker, showResult, guessMarker, isMapLoaded]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
      />
      
      {/* Single status overlay */}
      {!showResult && (
        <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
          {!guessMarker ? (
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🖱️</span>
              <span>Click to place your guess</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Guess placed</span>
            </div>
          )}
        </div>
      )}

      {/* Coordinate display */}
      {currentCoords && (
        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
          {currentCoords}
        </div>
      )}

      {/* Simplified result legend */}
      {showResult && guessMarker && actualMarker && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Your guess</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Actual</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 