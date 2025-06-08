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

    // Enhanced map style with detailed labels and geographic features
    const mapStyle = {
      "version": 8 as const,
      "name": "Enhanced World Map",
      "metadata": {
        "mapbox:autocomposite": true
      },
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
          "id": "background",
          "type": "background" as const,
          "paint": {
            "background-color": "#f8f8f8"
          }
        },
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
      center: [0, 20], // Start at a global view
      zoom: 2,
      attributionControl: false,
      maxZoom: 18
    });

    // Add controls
    map.current.addControl(new maplibregl.NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true
    }), 'top-right');

    map.current.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    map.current.addControl(new maplibregl.AttributionControl({
      compact: true,
      customAttribution: '© OpenStreetMap contributors'
    }), 'bottom-right');

    // Add fullscreen control
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

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

    // Show coordinates on hover
    const coordinatesDisplay = document.createElement('div');
    coordinatesDisplay.className = 'absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono';
    coordinatesDisplay.style.pointerEvents = 'none';
    coordinatesDisplay.style.display = 'none';
    mapContainer.current.appendChild(coordinatesDisplay);

    map.current.on('mousemove', (e) => {
      const { lat, lng } = e.lngLat;
      coordinatesDisplay.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      coordinatesDisplay.style.display = 'block';
    });

    map.current.on('mouseleave', () => {
      coordinatesDisplay.style.display = 'none';
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
      guessEl.className = 'relative';
      guessEl.innerHTML = `
        <div class="w-8 h-8 bg-blue-500 border-3 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform">
          YOU
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-blue-500"></div>
      `;
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
      actualEl.className = 'relative';
      actualEl.innerHTML = `
        <div class="w-8 h-8 bg-red-500 border-3 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:scale-110 transition-transform">
          📍
        </div>
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-500"></div>
      `;
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
          padding: 80,
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
        <div className="absolute top-4 left-4 bg-black/90 text-white px-3 py-2 rounded-lg text-sm shadow-lg backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🖱️</span>
            <span>Click anywhere on the map to place your guess</span>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Coordinates shown on hover
          </div>
        </div>
      )}

      {/* Marker legend when showing results */}
      {showResult && guessMarker && actualMarker && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg text-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
            <span className="font-medium">Your guess</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs">
              📍
            </div>
            <span className="font-medium">Actual location</span>
          </div>
        </div>
      )}

      {/* Map info panel */}
      <div className="absolute top-4 right-4 bg-black/90 text-white px-3 py-2 rounded-lg text-xs shadow-lg backdrop-blur-sm border border-white/20">
        <div className="flex items-center gap-2">
          <span className="text-green-400">🌍</span>
          <span>OpenStreetMap • High Detail</span>
        </div>
        <div className="text-gray-300 mt-1">
          Zoom for street names & landmarks
        </div>
      </div>
    </div>
  );
} 