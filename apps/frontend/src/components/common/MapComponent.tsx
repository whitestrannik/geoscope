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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // Free demo tiles
      center: [0, 20], // Start at a global view
      zoom: 2,
      attributionControl: false
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.AttributionControl({
      compact: true
    }), 'bottom-right');

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    // Add click handler for placing guesses (only when not showing results)
    map.current.on('click', (e) => {
      if (!showResult && onMarkerPlace) {
        const { lat, lng } = e.lngLat;
        onMarkerPlace(lat, lng);
      }
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
      guessEl.className = 'w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2';
      guessEl.title = `Your guess: ${guessMarker.lat.toFixed(4)}, ${guessMarker.lng.toFixed(4)}`;

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
      actualEl.className = 'w-6 h-6 bg-red-500 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2';
      actualEl.title = `Actual location: ${actualMarker.lat.toFixed(4)}, ${actualMarker.lng.toFixed(4)}`;

      actualMarkerRef.current = new maplibregl.Marker({
        element: actualEl,
        anchor: 'center'
      })
        .setLngLat([actualMarker.lng, actualMarker.lat])
        .addTo(map.current);

      // Fit map to show both markers if both exist
      if (guessMarker) {
        const bounds = new maplibregl.LngLatBounds();
        bounds.extend([guessMarker.lng, guessMarker.lat]);
        bounds.extend([actualMarker.lng, actualMarker.lat]);
        
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 10
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
      
      {/* Instructions overlay */}
      {!showResult && !guessMarker && (
        <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
          Click on the map to place your guess
        </div>
      )}

      {/* Marker legend when showing results */}
      {showResult && guessMarker && actualMarker && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Your guess</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Actual location</span>
          </div>
        </div>
      )}
    </div>
  );
} 