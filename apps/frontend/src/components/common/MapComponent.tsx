import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';

interface PlayerGuess {
  lat: number;
  lng: number;
  playerId: string;
  username: string;
}

interface ResultData {
  distance: number;
  score: number;
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
  resultData?: ResultData | null;
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
  className = "w-full h-96",
  resultData
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const guessMarkerRef = useRef<maplibregl.Marker | null>(null);
  const actualMarkerRef = useRef<maplibregl.Marker | null>(null);
  const distanceLabelRef = useRef<maplibregl.Marker | null>(null);
  const allDistanceLabelsRef = useRef<maplibregl.Marker[]>([]);
  const allGuessMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Zoom control functions
  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };

  const handleResetZoom = () => {
    if (map.current) {
      map.current.setCenter([0, 20]);
      map.current.setZoom(2);
    }
  };

  const handleFitToResults = () => {
    if (!map.current || !showResult) return;
    
    const bounds = new maplibregl.LngLatBounds();
    let hasPoints = false;
    
    // Add actual location to bounds
    if (currentActualLocation && typeof currentActualLocation.lat === 'number' && typeof currentActualLocation.lng === 'number') {
      bounds.extend([currentActualLocation.lng, currentActualLocation.lat]);
      hasPoints = true;
    }
    
    // Add user guess to bounds
    if (currentGuess && typeof currentGuess.lat === 'number' && typeof currentGuess.lng === 'number') {
      bounds.extend([currentGuess.lng, currentGuess.lat]);
      hasPoints = true;
    }
    
    // Add all guesses to bounds for multiplayer
    if (allGuesses && Array.isArray(allGuesses)) {
      allGuesses.forEach(guess => {
        if (guess && typeof guess.lat === 'number' && typeof guess.lng === 'number') {
          bounds.extend([guess.lng, guess.lat]);
          hasPoints = true;
        }
      });
    }
    
    // Only fit bounds if we have valid points
    if (!hasPoints) {
      console.warn('No valid points to fit bounds');
      return;
    }
    
    // Fit bounds with appropriate padding
    const topPadding = resultData ? 140 : 100;
    const sidePadding = 100;
    
    try {
      map.current.fitBounds(bounds, {
        padding: {
          top: topPadding,
          bottom: sidePadding,
          left: sidePadding,
          right: sidePadding
        },
        maxZoom: 8,
        duration: 1200
      });
    } catch (error) {
      console.error('Error fitting bounds:', error);
      // Fallback to centering on actual location if available
      if (currentActualLocation) {
        map.current.setCenter([currentActualLocation.lng, currentActualLocation.lat]);
        map.current.setZoom(6);
      }
    }
  };

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

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    // Click handlers - left click for fullscreen, right click for guess
    map.current.on('click', () => {
      // Left click - toggle fullscreen
      if (onDoubleClick) {
        onDoubleClick();
      }
    });

    // Right-click handler for placing guesses
    map.current.on('contextmenu', (e) => {
      e.preventDefault(); // Prevent context menu
      if (!disabled && !showResult && clickHandler) {
        const { lat, lng } = e.lngLat;
        clickHandler(lat, lng);
      }
    });

    // No coordinate tracking needed anymore

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

    // Remove existing distance label
    if (distanceLabelRef.current) {
      distanceLabelRef.current.remove();
      distanceLabelRef.current = null;
    }

    // Remove all existing distance labels for multiplayer
    allDistanceLabelsRef.current.forEach(label => label.remove());
    allDistanceLabelsRef.current = [];

    // Remove existing distance lines
    if (map.current.getLayer('distance-line')) {
      map.current.removeLayer('distance-line');
    }
    if (map.current.getSource('distance-line')) {
      map.current.removeSource('distance-line');
    }

    // Remove all multiplayer distance lines
    for (let i = 0; i < 10; i++) { // Support up to 10 players
      const layerId = `distance-line-${i}`;
      const sourceId = `distance-line-${i}`;
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
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

      // Draw distance lines for all players in multiplayer mode
      if (allGuesses && allGuesses.length > 0) {
        const colors = ['#fbbf24', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16', '#EC4899'];
        
        allGuesses.forEach((guess, index) => {
          const distance = calculateDistance(
            guess.lat, 
            guess.lng, 
            currentActualLocation.lat, 
            currentActualLocation.lng
          );

          const color = colors[index % colors.length];
          const layerId = `distance-line-${index}`;
          const sourceId = `distance-line-${index}`;

          // Add line source and layer for each player
          map.current!.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [guess.lng, guess.lat],
                  [currentActualLocation.lng, currentActualLocation.lat]
                ]
              }
            }
          });

          map.current!.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': color,
              'line-width': 2,
              'line-dasharray': [3, 3]
            }
          });

          // Add distance label at midpoint for each player
          const midLat = (guess.lat + currentActualLocation.lat) / 2;
          const midLng = (guess.lng + currentActualLocation.lng) / 2;

          const distanceEl = document.createElement('div');
          distanceEl.innerHTML = `
            <div class="px-2 py-1 rounded-lg text-xs font-bold shadow-lg border-2 border-white" style="background-color: ${color}; color: ${color === '#fbbf24' ? '#000' : '#fff'}">
              ${guess.username}: ${distance.toFixed(1)} km
            </div>
          `;

          const distanceLabel = new maplibregl.Marker({
            element: distanceEl,
            anchor: 'center'
          })
            .setLngLat([midLng, midLat])
            .addTo(map.current!);

          allDistanceLabelsRef.current.push(distanceLabel);
        });
      } else if (currentGuess) {
        // Single player mode - draw one distance line
        const distance = calculateDistance(
          currentGuess.lat, 
          currentGuess.lng, 
          currentActualLocation.lat, 
          currentActualLocation.lng
        );

        // Add line source and layer
        map.current.addSource('distance-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [currentGuess.lng, currentGuess.lat],
                [currentActualLocation.lng, currentActualLocation.lat]
              ]
            }
          }
        });

        map.current.addLayer({
          id: 'distance-line',
          type: 'line',
          source: 'distance-line',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#fbbf24', // Yellow color
            'line-width': 3,
            'line-dasharray': [2, 2]
          }
        });

        // Add distance label at midpoint
        const midLat = (currentGuess.lat + currentActualLocation.lat) / 2;
        const midLng = (currentGuess.lng + currentActualLocation.lng) / 2;

        const distanceEl = document.createElement('div');
        distanceEl.innerHTML = `
          <div class="bg-yellow-500 text-black px-2 py-1 rounded-lg text-sm font-bold shadow-lg border-2 border-white">
            ${distance.toFixed(1)} km
          </div>
        `;

        distanceLabelRef.current = new maplibregl.Marker({
          element: distanceEl,
          anchor: 'center'
        })
          .setLngLat([midLng, midLat])
          .addTo(map.current);
      }

      // Auto-fit bounds only once when results first appear
      setTimeout(() => {
        if (!map.current) return;
        handleFitToResults();
      }, 200); // Delay to ensure all markers are rendered
    }
  }, [currentActualLocation, showResult, currentGuess, allGuesses, isMapLoaded, resultData]);

  // Handle map resize when container size changes (e.g., fullscreen toggle)
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      map.current?.resize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [className, isMapLoaded]);

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-400';
    if (score >= 600) return 'text-yellow-400';
    if (score >= 400) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Results Header */}
      {showResult && resultData && (
        <div className="absolute top-3 left-3 right-3 bg-slate-900/95 backdrop-blur-lg border border-white/30 text-white px-4 py-3 rounded-lg shadow-lg z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">📏</span>
                <span className="text-sm font-medium">Your Distance:</span>
                <span className="text-lg font-bold text-blue-300">{resultData.distance.toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">🏆</span>
                <span className="text-sm font-medium">Your Score:</span>
                <span className={`text-lg font-bold ${getScoreColor(resultData.score)}`}>
                  {resultData.score.toLocaleString()}
                </span>
              </div>
              {allGuesses && allGuesses.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">👥</span>
                  <span className="text-sm font-medium">{allGuesses.length} players</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {allGuesses && allGuesses.length > 1 ? 'All results shown on map' : 'Results shown on map'}
            </div>
          </div>
        </div>
      )}

      <div 
        ref={mapContainer} 
        className={`w-full h-full rounded-lg overflow-hidden ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} map-container`}
      />
      
      {/* CSS to hide default MapLibre controls */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .map-container .maplibregl-ctrl-top-right,
          .map-container .maplibregl-ctrl-bottom-right,
          .map-container .maplibregl-ctrl-bottom-left,
          .map-container .maplibregl-ctrl {
            display: none !important;
          }
        `
      }} />
      
      {/* Custom Zoom Controls */}
      <div className={`absolute ${showResult && resultData ? 'top-20' : 'top-4'} right-4 flex flex-col gap-1 opacity-90 hover:opacity-100 transition-all duration-300 z-20`}>
        <Button
          size="sm"
          className="bg-black/70 hover:bg-black/90 border-white/20 text-white hover:text-white w-9 h-9 p-0 rounded-lg backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105"
          onClick={handleZoomIn}
          title="Zoom in"
        >
          <span className="text-lg font-semibold leading-none">+</span>
        </Button>
        <Button
          size="sm"
          className="bg-black/70 hover:bg-black/90 border-white/20 text-white hover:text-white w-9 h-9 p-0 rounded-lg backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105"
          onClick={handleZoomOut}
          title="Zoom out"
        >
          <span className="text-lg font-semibold leading-none">−</span>
        </Button>
        {showResult ? (
          <Button
            size="sm"
            className="bg-blue-600/80 hover:bg-blue-700/90 border-blue-400/30 text-white hover:text-white text-xs h-9 px-2 rounded-lg backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105"
            onClick={handleFitToResults}
            title="Fit to results"
          >
            <span className="font-medium">Fit</span>
          </Button>
        ) : null}
        <Button
          size="sm"
          className="bg-black/70 hover:bg-black/90 border-white/20 text-white hover:text-white text-xs h-9 px-2 rounded-lg backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105"
          onClick={handleResetZoom}
          title="Reset zoom and position"
        >
          <span className="font-medium">Reset</span>
        </Button>
      </div>

      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-sm backdrop-blur-sm">
          {showResult ? 'Viewing results' : 'Round not active'}
        </div>
      )}
    </div>
  );
} 