export interface UnsplashImage {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
  };
  width: number;
  height: number;
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

// Server-side only - do not use NEXT_PUBLIC_ prefix for security
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export async function searchImages(query: string, perPage: number = 3): Promise<UnsplashImage[]> {
  // Check if API key is available
  if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
    console.warn('Unsplash API key not configured, using fallback images');
    return [];
  }

  try {
    console.log(`Searching Unsplash for: "${query}"`);
    
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&content_filter=high`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          'Accept-Version': 'v1',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Unsplash API error: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 401) {
        console.error('Unauthorized - check your Unsplash API key');
      } else if (response.status === 403) {
        console.error('Rate limit exceeded or access denied');
      }
      
      return [];
    }

    const data: UnsplashSearchResponse = await response.json();
    console.log(`Found ${data.results.length} images for query: "${query}"`);
    return data.results;
  } catch (error) {
    console.error(`Network error fetching images from Unsplash for query "${query}":`, error);
    return [];
  }
}

export async function searchImagesForQueries(queries: string[]): Promise<UnsplashImage[]> {
  const allImages: UnsplashImage[] = [];
  const seenIds = new Set<string>();

  console.log(`Starting image search for ${queries.length} queries:`, queries);

  for (const query of queries) {
    if (allImages.length >= 12) {
      console.log('Reached maximum image limit, stopping search');
      break;
    }
    
    try {
      const images = await searchImages(query, 3);
      
      if (images.length > 0) {
        // Filter out duplicates and add to collection
        const uniqueImages = images.filter(img => !seenIds.has(img.id));
        uniqueImages.forEach(img => seenIds.add(img.id));
        allImages.push(...uniqueImages);
        console.log(`Added ${uniqueImages.length} unique images from query "${query}"`);
      } else {
        console.log(`No images found for query "${query}"`);
      }
      
      // Add a small delay to respect rate limits (Unsplash allows 50 requests/hour for demo)
      if (queries.indexOf(query) < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`Error searching for query "${query}":`, error);
    }
  }

  const finalImages = allImages.slice(0, 10); // Return maximum 10 images
  console.log(`Final image collection: ${finalImages.length} images`);
  return finalImages;
}

export function getFallbackImages(): UnsplashImage[] {
  // Return curated beautiful stock images as fallbacks when Unsplash is not available
  const fallbackImages = [
    {
      id: 'fallback-1',
      description: 'Beautiful mountain landscape at sunset',
      alt_description: 'Stunning mountain peaks with golden sunset light',
      urls: {
        raw: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3',
        full: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb',
        regular: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=1080&fit=max',
        small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=400&fit=max',
        thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=200&fit=max',
      },
      user: {
        name: 'Luca Bravo',
        username: 'lucabravo',
      },
      width: 1920,
      height: 1080,
    },
    {
      id: 'fallback-2',
      description: 'Modern minimalist workspace setup',
      alt_description: 'Clean desk with laptop, coffee, and plants',
      urls: {
        raw: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3',
        full: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb',
        regular: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=1080&fit=max',
        small: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=400&fit=max',
        thumb: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=200&fit=max',
      },
      user: {
        name: 'Domenico Loia',
        username: 'domenicoloia',
      },
      width: 1920,
      height: 1080,
    },
    {
      id: 'fallback-3',
      description: 'Ocean waves crashing on rocky shore',
      alt_description: 'Dramatic seascape with waves and rocks',
      urls: {
        raw: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3',
        full: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb',
        regular: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=1080&fit=max',
        small: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=400&fit=max',
        thumb: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=200&fit=max',
      },
      user: {
        name: 'Jeremy Bishop',
        username: 'jeremybishop',
      },
      width: 1920,
      height: 1080,
    },
    {
      id: 'fallback-4',
      description: 'Abstract colorful geometric shapes',
      alt_description: 'Modern abstract art with vibrant colors',
      urls: {
        raw: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3',
        full: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb',
        regular: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=1080&fit=max',
        small: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=400&fit=max',
        thumb: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=200&fit=max',
      },
      user: {
        name: 'Pawel Czerwinski',
        username: 'pawel_czerwinski',
      },
      width: 1920,
      height: 1080,
    },
    {
      id: 'fallback-5',
      description: 'Urban city skyline at night',
      alt_description: 'City buildings illuminated at dusk',
      urls: {
        raw: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3',
        full: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb',
        regular: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=1080&fit=max',
        small: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=400&fit=max',
        thumb: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=srgb&w=200&fit=max',
      },
      user: {
        name: 'Pedro Lastra',
        username: 'peterlaster',
      },
      width: 1920,
      height: 1080,
    },
  ];

  // Return a random selection of 3-4 images to add variety
  const shuffled = fallbackImages.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 2) + 3); // 3-4 images
}