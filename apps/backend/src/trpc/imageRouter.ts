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

// Real Mapillary API integration
async function fetchFromMapillary(): Promise<ImageResponse> {
  // Import env here to avoid circular imports
  const { env } = await import('../lib/env.js');
  const accessToken = env.MAPILLARY_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.warn('MAPILLARY_ACCESS_TOKEN not found, using mock data');
    return getRandomMockImage();
  }

  try {
    
    // Define geographic regions for diversity
    const geographicRegions = [
      { name: 'Europe', bbox: '-10,35,40,70' },
      { name: 'North America', bbox: '-130,25,-60,50' },
      { name: 'South America', bbox: '-80,-30,-40,10' },
      { name: 'Asia', bbox: '60,10,150,50' },
      { name: 'Australia', bbox: '110,-45,160,-10' },
      { name: 'Africa', bbox: '-20,-35,50,35' }
    ];
    
    // Pick a random region for geographic diversity
    const regionIndex = Math.floor(Math.random() * geographicRegions.length);
    const randomRegion = geographicRegions[regionIndex]!; // Safe because array is not empty
    
    // Use proper authorization header and bbox parameter
    const response = await fetch(
      `https://graph.mapillary.com/images?bbox=${randomRegion.bbox}&fields=id,thumb_2048_url,computed_geometry&limit=50`,
      {
        method: 'GET',
        headers: {
          'Authorization': `OAuth ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mapillary API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      console.warn(`⚠️  No images returned from Mapillary API for ${randomRegion.name} - using mock data`);
      return getRandomMockImage();
    }

    // Pick a random image from the results
    const imageIndex = Math.floor(Math.random() * data.data.length);
    const mapillaryImage = data.data[imageIndex];
    return processMapillaryResponse(mapillaryImage);
  } catch (error) {
    console.error('❌ Error fetching from Mapillary API:', error instanceof Error ? error.message : String(error));
    return getRandomMockImage();
  }
}

// Process Mapillary API response into our format
function processMapillaryResponse(mapillaryImage: any): ImageResponse {
  // Use computed_geometry if available, fallback to geometry
  const geometry = mapillaryImage.computed_geometry || mapillaryImage.geometry;
  const [lng, lat] = geometry.coordinates; // Mapillary uses [lng, lat] format
  
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
        throw new Error('Failed to fetch random image');
      }
    })
}); 