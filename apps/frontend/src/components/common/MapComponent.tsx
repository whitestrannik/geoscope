import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface PlayerGuess {
  lat: number;
  lng: number;
  playerId: string;
  username: string;
}

interface MapComponentProps {
  onMarkerPlace?: (lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onDoubleClick?: () => void;
  guessMarker?: { lat: number; lng: number } | null;
  userGuess?: { lat: number; lng: number } | null;
  actualMarker?: { lat: number; lng: number } | null;
  actualLocation?: { lat: number; lng: number } | null;
  allGuesses?: PlayerGuess[];
  showResult?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MapComponent({ 
  onMarkerPlace,
  onMapClick, 
  onDoubleClick,
  guessMarker,
  userGuess, 
  actualMarker,
  actualLocation, 
  allGuesses,
  showResult = false,
  disabled = false,
  className = "w-full h-96"
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const guessMarkerRef = useRef<maplibregl.Marker | null>(null);
  const actualMarkerRef = useRef<maplibregl.Marker | null>(null);
  const allGuessMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<string>('');

  // Use the new prop names with fallback to old ones for backward compatibility
  const currentGuess = userGuess || guessMarker;
  const currentActualLocation = actualLocation || actualMarker;
  const clickHandler = onMapClick || onMarkerPlace;

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
      if (!disabled && !showResult && clickHandler) {
        const { lat, lng } = e.lngLat;
        clickHandler(lat, lng);
        return;
      }
      
      // Double-click for fullscreen if no guess placement
      if (onDoubleClick) {
        onDoubleClick();
      }
    });

    // Right-click handler as alternative
    map.current.on('contextmenu', (e) => {
      e.preventDefault(); // Prevent context menu
      if (!disabled && !showResult && clickHandler) {
        const { lat, lng } = e.lngLat;
        clickHandler(lat, lng);
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

  // Update user's guess marker
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing guess marker
    if (guessMarkerRef.current) {
      guessMarkerRef.current.remove();
      guessMarkerRef.current = null;
    }

    // Add new guess marker if provided
    if (currentGuess) {
      const guessEl = document.createElement('div');
      guessEl.innerHTML = `
        <div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform">
          ✓
        </div>
      `;
      guessEl.title = `Your guess: ${currentGuess.lat.toFixed(3)}, ${currentGuess.lng.toFixed(3)}`;

      guessMarkerRef.current = new maplibregl.Marker({
        element: guessEl,
        anchor: 'center'
      })
        .setLngLat([currentGuess.lng, currentGuess.lat])
        .addTo(map.current);
    }
  }, [currentGuess, isMapLoaded]);

  // Update all players' guess markers (for multiplayer results)
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing markers
    allGuessMarkersRef.current.forEach(marker => marker.remove());
    allGuessMarkersRef.current = [];

    // Add all guess markers if showing results
    if (allGuesses && showResult) {
      const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];
      
      allGuesses.forEach((guess, index) => {
        const color = colors[index % colors.length];
        const markerEl = document.createElement('div');
        markerEl.innerHTML = `
          <div class="w-6 h-6 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform" style="background-color: ${color}">
            ${index + 1}
          </div>
        `;
        markerEl.title = `${guess.username}: ${guess.lat.toFixed(3)}, ${guess.lng.toFixed(3)}`;

        const marker = new maplibregl.Marker({
          element: markerEl,
          anchor: 'center'
        })
          .setLngLat([guess.lng, guess.lat])
          .addTo(map.current!);

        allGuessMarkersRef.current.push(marker);
      });
    }
  }, [allGuesses, showResult, isMapLoaded]);

  // Update actual marker (only shown in results)
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing actual marker
    if (actualMarkerRef.current) {
      actualMarkerRef.current.remove();
      actualMarkerRef.current = null;
    }

    // Add actual marker if provided and showing results
    if (currentActualLocation && showResult) {
      const actualEl = document.createElement('div');
      actualEl.innerHTML = `
        <div class="w-8 h-8 bg-red-500 border-3 border-white rounded-full shadow-lg flex items-center justify-center text-white text-sm cursor-pointer hover:scale-110 transition-transform">
          📍
        </div>
      `;
      actualEl.title = `Actual location: ${currentActualLocation.lat.toFixed(3)}, ${currentActualLocation.lng.toFixed(3)}`;

      actualMarkerRef.current = new maplibregl.Marker({
        element: actualEl,
        anchor: 'center'
      })
        .setLngLat([currentActualLocation.lng, currentActualLocation.lat])
        .addTo(map.current);

      // Smart bounds fitting
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([currentActualLocation.lng, currentActualLocation.lat]);
      
      // Include user's guess in bounds
      if (currentGuess) {
        bounds.extend([currentGuess.lng, currentGuess.lat]);
      }
      
      // Include all guesses in bounds for multiplayer
      if (allGuesses) {
        allGuesses.forEach(guess => {
          bounds.extend([guess.lng, guess.lat]);
        });
      }
      
      map.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 10
      });
    }
  }, [currentActualLocation, showResult, currentGuess, allGuesses, isMapLoaded]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className={`w-full h-full rounded-lg overflow-hidden ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      />
      
      {/* Status overlay */}
      {!showResult && !disabled && (
        <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm">
          {!currentGuess ? (
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🖱️</span>
              <span>Click to place your guess</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <span>Guess placed: {currentGuess.lat.toFixed(3)}, {currentGuess.lng.toFixed(3)}</span>
            </div>
          )}
        </div>
      )}

      {/* Coordinates display */}
      {currentCoords && !disabled && (
        <div className="absolute bottom-3 left-3 bg-black/80 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
          {currentCoords}
        </div>
      )}

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-sm backdrop-blur-sm">
          Guess already submitted
        </div>
      )}
    </div>
  );
} 