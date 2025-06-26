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

    // Gaming/Tactical map style with English labels
    const mapStyle = {
      "version": 8 as const,
      "name": "Gaming Tactical Map",
      "sources": {
        "carto-voyager": {
          "type": "raster" as const,
          "tiles": ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
          "tileSize": 256,
          "attribution": "© CARTO © OpenStreetMap contributors"
        }
      },
      "layers": [
        {
          "id": "voyager-layer",
          "source": "carto-voyager",
          "type": "raster" as const
        }
      ]
    };

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [0, 20],
        zoom: 2,
        attributionControl: false,
        maxZoom: 18,
        locale: {
          // Force English labels
          'name': '{name_en}',
          'name:latin': '{name_en}'
        }
      });

      map.current.on('load', () => {
        setIsMapLoaded(true);
        
        // Initial resize after load
        setTimeout(() => {
          if (map.current) {
            map.current.resize();
          }
        }, 100);
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
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

    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor container size changes with ResizeObserver
  useEffect(() => {
    if (!mapContainer.current || !map.current || !isMapLoaded) return;

    const resizeObserver = new ResizeObserver(() => {
      // Trigger map resize with a small delay
      setTimeout(() => {
        if (map.current) {
          map.current.resize();
        }
      }, 100);
    });

    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isMapLoaded]);

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
        <div class="relative group">
          <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-cyan-300 rounded-full shadow-lg shadow-purple-500/50 flex items-center justify-center text-cyan-100 text-sm font-bold cursor-pointer hover:scale-110 transition-all duration-300 animate-pulse">
            🎯
          </div>
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"></div>
        </div>
      `;
      guessEl.title = `YOUR TARGET: ${currentGuess.lat.toFixed(3)}, ${currentGuess.lng.toFixed(3)}`;

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
      const colors = [
        { bg: 'from-cyan-500 to-blue-600', border: 'border-cyan-300', shadow: 'shadow-cyan-500/50' },
        { bg: 'from-red-500 to-red-700', border: 'border-red-300', shadow: 'shadow-red-500/50' },
        { bg: 'from-green-500 to-emerald-600', border: 'border-green-300', shadow: 'shadow-green-500/50' },
        { bg: 'from-yellow-500 to-orange-600', border: 'border-yellow-300', shadow: 'shadow-yellow-500/50' },
        { bg: 'from-purple-500 to-violet-700', border: 'border-purple-300', shadow: 'shadow-purple-500/50' },
        { bg: 'from-pink-500 to-rose-600', border: 'border-pink-300', shadow: 'shadow-pink-500/50' }
      ];
      
      allGuesses.forEach((guess, index) => {
        const colorScheme = colors[index % colors.length];
        const markerEl = document.createElement('div');
        markerEl.innerHTML = `
          <div class="relative group">
            <div class="w-7 h-7 bg-gradient-to-br ${colorScheme.bg} border-2 ${colorScheme.border} rounded-full shadow-lg ${colorScheme.shadow} flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-all duration-300 font-mono">
              #${index + 1}
            </div>
            <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-md border border-cyan-500/30 text-cyan-300 px-2 py-1 rounded text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
              ${guess.username}
            </div>
          </div>
        `;
        markerEl.title = `OPERATIVE ${guess.username}: ${guess.lat.toFixed(3)}, ${guess.lng.toFixed(3)}`;

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

  // Update actual location marker
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Remove existing actual marker and distance label
    if (actualMarkerRef.current) {
      actualMarkerRef.current.remove();
      actualMarkerRef.current = null;
    }
    if (distanceLabelRef.current) {
      distanceLabelRef.current.remove();
      distanceLabelRef.current = null;
    }

    // Remove all distance labels
    allDistanceLabelsRef.current.forEach(label => label.remove());
    allDistanceLabelsRef.current = [];

    // Remove distance line from map
    if (map.current.getLayer('distance-line')) {
      map.current.removeLayer('distance-line');
    }
    if (map.current.getSource('distance-line')) {
      map.current.removeSource('distance-line');
    }

    // Remove all distance lines for multiplayer
    const layerIds = ['distance-line-1', 'distance-line-2', 'distance-line-3', 'distance-line-4', 'distance-line-5', 'distance-line-6'];
    layerIds.forEach(layerId => {
      if (map.current && map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current && map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
    });

    // Add actual location marker if showing results
    if (currentActualLocation && showResult) {
      const actualEl = document.createElement('div');
      actualEl.innerHTML = `
        <div class="relative group">
          <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 border-3 border-yellow-300 rounded-full shadow-xl shadow-red-500/50 flex items-center justify-center text-yellow-100 text-lg font-bold cursor-pointer hover:scale-110 transition-all duration-300 animate-bounce">
            📍
          </div>
          <div class="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          <div class="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full"></div>
          <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-md border border-red-500/50 text-red-300 px-2 py-1 rounded text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
            ACTUAL LOCATION
          </div>
        </div>
      `;
      actualEl.title = `ACTUAL TARGET: ${currentActualLocation.lat.toFixed(3)}, ${currentActualLocation.lng.toFixed(3)}`;

      actualMarkerRef.current = new maplibregl.Marker({
        element: actualEl,
        anchor: 'center'
      })
        .setLngLat([currentActualLocation.lng, currentActualLocation.lat])
        .addTo(map.current);

      // In multiplayer mode, draw lines for all guesses
      if (allGuesses && allGuesses.length > 0) {
        const colors = [
          '#06b6d4', // cyan
          '#ef4444', // red  
          '#10b981', // emerald
          '#f59e0b', // amber
          '#8b5cf6', // violet
          '#ec4899'  // pink
        ];

        allGuesses.forEach((guess, index) => {
          const distance = calculateDistance(guess.lat, guess.lng, currentActualLocation.lat, currentActualLocation.lng);
          const color = colors[index % colors.length];
          const layerId = `distance-line-${index + 1}`;

          // Add distance line source and layer
          map.current!.addSource(layerId, {
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
            source: layerId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': color,
              'line-width': 3,
              'line-dasharray': [4, 2],
              'line-opacity': 0.8
            }
          });

          // Add distance label at midpoint
          const midLat = (guess.lat + currentActualLocation.lat) / 2;
          const midLng = (guess.lng + currentActualLocation.lng) / 2;

          const distanceEl = document.createElement('div');
          distanceEl.innerHTML = `
            <div class="bg-gradient-to-r from-black/90 to-slate-900/90 text-white border-2 px-2 py-1 rounded text-xs font-bold font-mono shadow-lg backdrop-blur-sm" style="border-color: ${color}; color: ${color};">
              <div class="flex items-center gap-1">
                <span>#${index + 1}</span>
                <span>${distance.toFixed(1)}km</span>
              </div>
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
        // Single player mode - draw line only for user's guess
        const distance = calculateDistance(currentGuess.lat, currentGuess.lng, currentActualLocation.lat, currentActualLocation.lng);

        // Add distance line source and layer
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
            'line-color': '#fbbf24', // Gaming yellow
            'line-width': 4,
            'line-dasharray': [3, 3],
            'line-opacity': 0.9
          }
        });

        // Add distance label at midpoint with gaming style
        const midLat = (currentGuess.lat + currentActualLocation.lat) / 2;
        const midLng = (currentGuess.lng + currentActualLocation.lng) / 2;

        const distanceEl = document.createElement('div');
        distanceEl.innerHTML = `
          <div class="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-2 rounded-lg text-sm font-bold font-mono shadow-xl border-2 border-yellow-300 backdrop-blur-sm">
            <div class="flex items-center gap-1">
              <span>📏</span>
              <span>${distance.toFixed(1)} KM</span>
            </div>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentActualLocation, showResult, currentGuess, allGuesses, isMapLoaded, resultData]);

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
      {/* Gaming Results Header */}
      {showResult && resultData && (
        <div className="absolute top-3 left-3 right-3 bg-black/95 backdrop-blur-xl border border-cyan-500/50 text-white px-4 py-3 rounded-lg shadow-xl shadow-cyan-500/20 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 text-lg">📏</span>
                <span className="text-sm font-mono text-cyan-300">DISTANCE:</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">{resultData.distance.toFixed(1)} KM</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-lg">🏆</span>
                <span className="text-sm font-mono text-yellow-300">SCORE:</span>
                <span className={`text-lg font-bold font-mono ${getScoreColor(resultData.score)}`}>
                  {resultData.score.toLocaleString()}
                </span>
              </div>
              {allGuesses && allGuesses.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-lg">⚔</span>
                  <span className="text-sm font-mono text-purple-300">OPERATIVES:</span>
                  <span className="text-lg font-bold text-purple-400 font-mono">{allGuesses.length}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              {allGuesses && allGuesses.length > 1 ? '&gt; ALL TARGETS ON TACTICAL MAP' : '&gt; RESULTS ON TACTICAL MAP'}
            </div>
          </div>
        </div>
      )}

      <div 
        ref={mapContainer} 
        className={`w-full h-full rounded-lg overflow-hidden border border-cyan-500/30 shadow-lg shadow-cyan-500/10 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} map-container relative`}
        style={{ 
          position: 'relative',
          height: '100%',
          minHeight: '400px',
          flex: '1 1 0%',
          boxSizing: 'border-box'
        }}
      >
        {/* Gaming grid overlay */}
        <div className="absolute inset-0 pointer-events-none z-10" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>

        {/* Loading indicator */}
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm text-white z-50">
            <div className="text-center">
              <div className="relative">
                <div className="w-8 h-8 bg-cyan-400 rounded-full animate-ping mx-auto mb-3"></div>
                <div className="absolute inset-0 w-8 h-8 bg-cyan-500 rounded-full mx-auto"></div>
              </div>
              <p className="text-sm font-mono text-cyan-300">[ LOADING TACTICAL MAP... ]</p>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS to ensure map fills container properly */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .map-container {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: 400px;
            flex: 1 1 0%;
            display: flex;
            flex-direction: column;
          }
          .map-container canvas {
            outline: none !important;
          }
          .map-container .maplibregl-ctrl-top-right,
          .map-container .maplibregl-ctrl-bottom-right,
          .map-container .maplibregl-ctrl-bottom-left,
          .map-container .maplibregl-ctrl {
            display: none !important;
          }
          .maplibregl-map {
            width: 100% !important;
            height: 100% !important;
            flex: 1 1 0% !important;
          }
          .maplibregl-canvas-container {
            width: 100% !important;
            height: 100% !important;
          }
          .maplibregl-canvas {
            width: 100% !important;
            height: 100% !important;
          }
        `
      }} />
      
      {/* Gaming-style Custom Zoom Controls */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-2 opacity-90 hover:opacity-100 transition-all duration-300 z-20">
        <Button
          size="sm"
          className="bg-black/80 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 w-10 h-10 p-0 rounded-lg backdrop-blur-md shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-105 font-mono"
          onClick={handleZoomIn}
          title="Tactical Zoom In"
        >
          <span className="text-lg font-bold leading-none">+</span>
        </Button>
        <Button
          size="sm"
          className="bg-black/80 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 w-10 h-10 p-0 rounded-lg backdrop-blur-md shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-105 font-mono"
          onClick={handleZoomOut}
          title="Tactical Zoom Out"
        >
          <span className="text-lg font-bold leading-none">−</span>
        </Button>
        {showResult ? (
          <Button
            size="sm"
            className="bg-purple-600/80 hover:bg-purple-500/90 border border-purple-400/30 text-purple-100 hover:text-white text-xs h-10 px-3 rounded-lg backdrop-blur-md shadow-lg shadow-purple-500/20 transition-all duration-300 hover:scale-105 font-mono"
            onClick={handleFitToResults}
            title="Focus All Targets"
          >
            <span className="font-bold">FIT</span>
          </Button>
        ) : null}
        <Button
          size="sm"
          className="bg-black/80 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 text-xs h-10 px-2 rounded-lg backdrop-blur-md shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-105 font-mono"
          onClick={handleResetZoom}
          title="Reset Tactical View"
        >
          <span className="font-bold">RST</span>
        </Button>
      </div>

      {/* Gaming Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-cyan-300 text-sm font-mono z-30">
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-lg">
            {showResult ? '[ REVIEWING TACTICAL DATA ]' : '[ MISSION STANDBY ]'}
          </div>
        </div>
      )}
    </div>
  );
} 