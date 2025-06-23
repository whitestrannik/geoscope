import { z } from 'zod';
import { router, publicProcedure } from './trpc.js';

// Mock data for development - will be replaced with real Mapillary API
const MOCK_IMAGES = [
  {
    id: 'img1',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop',
    actualLat: 46.2044,
    actualLng: 6.1432,
    location: 'Geneva, Switzerland',
    copyright: 'Unsplash'
  },
  {
    id: 'img2', 
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=800&fit=crop',
    actualLat: 51.5074,
    actualLng: -0.1278,
    location: 'London, UK',
    copyright: 'Unsplash'
  },
  {
    id: 'img3',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    actualLat: 40.7128,
    actualLng: -74.0060,
    location: 'New York, USA',
    copyright: 'Unsplash'
  },
  {
    id: 'img4',
    imageUrl: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1200&h=800&fit=crop',
    actualLat: 35.6762,
    actualLng: 139.6503,
    location: 'Tokyo, Japan',
    copyright: 'Unsplash'
  },
  {
    id: 'img5',
    imageUrl: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=1200&h=800&fit=crop',
    actualLat: -33.8688,
    actualLng: 151.2093,
    location: 'Sydney, Australia',
    copyright: 'Unsplash'
  }
];

// Response schema
const ImageResponseSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url(),
  actualLat: z.number(),
  actualLng: z.number(),
  location: z.string().optional(),
  copyright: z.string().optional()
});

export type ImageResponse = z.infer<typeof ImageResponseSchema>;

// Helper function to create an AbortController with timeout
function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  // Clear timeout if request completes normally
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
  
  return controller;
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries: number = 3, 
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain errors
      if (lastError.message.includes('Invalid OAuth') || lastError.message.includes('unauthorized')) {
        throw lastError;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.log(`🔄 Mapillary API attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Real Mapillary API integration with improved error handling
async function fetchFromMapillary(): Promise<ImageResponse> {
  // Import env here to avoid circular imports
  const { env } = await import('../lib/env.js');
  const accessToken = env.MAPILLARY_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.warn('⚠️  MAPILLARY_ACCESS_TOKEN not found, using mock data');
    return getRandomMockImage();
  }

  try {
    // Use smaller, more focused regions to reduce query complexity and avoid timeouts
    const smallerRegions = [
      // Major cities and well-covered areas for better success rate
      { name: 'London, UK', bbox: '-0.5,51.3,0.2,51.7' },
      { name: 'Berlin, Germany', bbox: '13.0,52.3,13.8,52.7' },
      { name: 'Paris, France', bbox: '2.0,48.7,2.7,49.0' },
      { name: 'New York, USA', bbox: '-74.2,40.5,-73.7,40.9' },
      { name: 'San Francisco, USA', bbox: '-122.7,37.6,-122.3,37.9' },
      { name: 'Tokyo, Japan', bbox: '139.5,35.5,140.0,35.9' },
      { name: 'Sydney, Australia', bbox: '150.8,-34.0,151.3,-33.7' },
      { name: 'Toronto, Canada', bbox: '-79.6,43.5,-79.2,43.9' },
      { name: 'Amsterdam, Netherlands', bbox: '4.7,52.2,5.1,52.5' },
      { name: 'Stockholm, Sweden', bbox: '17.8,59.2,18.3,59.4' }
    ];
    
    // Pick a random region
    const regionIndex = Math.floor(Math.random() * smallerRegions.length);
    const randomRegion = smallerRegions[regionIndex]!;
    
    return await retryWithBackoff(async () => {
      // Create request with timeout (15 seconds)
      const controller = createTimeoutController(15000);
      
      console.log(`🌍 Fetching images from ${randomRegion.name}...`);
      
      // Use smaller limit to reduce query complexity
      const response = await fetch(
        `https://graph.mapillary.com/images?bbox=${randomRegion.bbox}&fields=id,thumb_2048_url,computed_geometry&limit=25`,
        {
          method: 'GET',
          headers: {
            'Authorization': `OAuth ${accessToken}`,
            'Accept': 'application/json',
            'User-Agent': 'GeoScope/1.0'
          },
          signal: controller.signal
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mapillary API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        console.warn(`⚠️  No images returned from Mapillary API for ${randomRegion.name}`);
        throw new Error('No images found in region');
      }

      // Pick a random image from the results
      const imageIndex = Math.floor(Math.random() * data.data.length);
      const mapillaryImage = data.data[imageIndex];
      
      console.log(`✅ Successfully fetched image from ${randomRegion.name}`);
      return processMapillaryResponse(mapillaryImage);
    }, 3, 2000); // 3 attempts with 2 second base delay
    
  } catch (error) {
    console.error('❌ Error fetching from Mapillary API:', error instanceof Error ? error.message : String(error));
    console.log('🔄 Falling back to mock data...');
    return getRandomMockImage();
  }
}

// Process Mapillary API response into our format
function processMapillaryResponse(mapillaryImage: any): ImageResponse {
  // Use computed_geometry if available, fallback to geometry
  const geometry = mapillaryImage.computed_geometry || mapillaryImage.geometry;
  
  if (!geometry || !geometry.coordinates) {
    throw new Error('Invalid geometry data from Mapillary API');
  }
  
  const [lng, lat] = geometry.coordinates; // Mapillary uses [lng, lat] format
  
  // Validate coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number' || 
      lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Invalid coordinates from Mapillary API');
  }
  
  return {
    id: mapillaryImage.id,
    imageUrl: mapillaryImage.thumb_2048_url,
    actualLat: lat,
    actualLng: lng,
    location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, // Simple coordinate display
    copyright: 'Mapillary'
  };
}

function getRandomMockImage(): ImageResponse {
  const randomIndex = Math.floor(Math.random() * MOCK_IMAGES.length);
  return MOCK_IMAGES[randomIndex]!; // Safe because array is not empty
}

export const imageRouter = router({
  getRandom: publicProcedure
    .query(async () => {
      try {
        const image = await fetchFromMapillary();
        
        return {
          id: image.id,
          imageUrl: image.imageUrl,
          actualLat: image.actualLat,
          actualLng: image.actualLng,
          location: image.location,
          copyright: image.copyright
        };
      } catch (error) {
        console.error('Error in getRandom procedure:', error);
        // Return mock data instead of throwing to keep the game playable
        const mockImage = getRandomMockImage();
        console.log('🎮 Using mock data to keep game functional');
        return mockImage;
      }
    })
}); 