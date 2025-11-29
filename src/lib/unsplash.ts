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
      const images = await searchImages(query, 5); // Fetch 5 to have options
      
      if (images.length > 0) {
        // Use smart selection to pick the best image from results
        // Prefer 2nd or 3rd result over 1st
        const bestImage = selectBestImage(images, 1);
        
        if (bestImage && !seenIds.has(bestImage.id)) {
          seenIds.add(bestImage.id);
          allImages.push(bestImage);
          console.log(`Added best image from query "${query}"`);
        } else if (bestImage) {
          console.log(`Best image from "${query}" was duplicate, trying alternatives`);
          // Try other images if best was duplicate
          for (const img of images) {
            if (!seenIds.has(img.id)) {
              seenIds.add(img.id);
              allImages.push(img);
              console.log(`Added alternative image from query "${query}"`);
              break;
            }
          }
        }
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

/**
 * Select the best image from search results based on quality metrics
 * Considers aspect ratio, resolution, and description quality
 */
export function selectBestImage(images: UnsplashImage[], preferredIndex: number = 1): UnsplashImage | null {
  if (images.length === 0) return null;
  if (images.length === 1) return images[0];
  
  // Score each image
  const scoredImages = images.map((image, index) => {
    let score = 0;
    
    // 1. Aspect ratio score (prefer landscape for hero images)
    const aspectRatio = image.width / image.height;
    if (aspectRatio >= 1.5 && aspectRatio <= 2.5) {
      score += 30; // Ideal landscape ratio
    } else if (aspectRatio >= 1.2 && aspectRatio < 1.5) {
      score += 20; // Acceptable landscape
    } else if (aspectRatio > 2.5) {
      score += 10; // Too wide
    } else {
      score += 5; // Portrait or square (less ideal for hero)
    }
    
    // 2. Resolution score (prefer higher resolution)
    const totalPixels = image.width * image.height;
    if (totalPixels >= 2000000) { // 2MP+
      score += 25;
    } else if (totalPixels >= 1000000) { // 1MP+
      score += 15;
    } else {
      score += 5;
    }
    
    // 3. Description quality score
    const description = image.description || image.alt_description || '';
    if (description.length > 50) {
      score += 20; // Detailed description
    } else if (description.length > 20) {
      score += 10; // Some description
    } else if (description.length > 0) {
      score += 5; // Minimal description
    }
    
    // 4. Position bonus (prefer 2nd and 3rd results slightly over 1st)
    if (index === preferredIndex) {
      score += 15; // Preferred position
    } else if (index === preferredIndex - 1 || index === preferredIndex + 1) {
      score += 10; // Adjacent to preferred
    } else if (index === 0) {
      score += 5; // First result (often too generic)
    }
    
    return { image, score, index };
  });
  
  // Sort by score (descending)
  scoredImages.sort((a, b) => b.score - a.score);
  
  console.log('Image selection scores:', scoredImages.map(s => ({
    index: s.index,
    score: s.score,
    aspectRatio: (s.image.width / s.image.height).toFixed(2),
    resolution: `${s.image.width}x${s.image.height}`,
    hasDescription: !!(s.image.description || s.image.alt_description)
  })));
  
  // Return the highest scored image
  return scoredImages[0].image;
}

/**
 * Search for the best hero image using smart selection
 * Fetches multiple results and picks the best one
 */
export async function searchBestHeroImage(query: string): Promise<UnsplashImage | null> {
  try {
    console.log(`Searching for best hero image with query: "${query}"`);
    
    // Fetch 5 results to have options
    const images = await searchImages(query, 5);
    
    if (images.length === 0) {
      console.log('No images found for hero query');
      return null;
    }
    
    // Select the best image (prefer 2nd result by default)
    const bestImage = selectBestImage(images, 1);
    
    if (bestImage) {
      console.log(`Selected best hero image (aspect ratio: ${(bestImage.width / bestImage.height).toFixed(2)})`);
    }
    
    return bestImage;
  } catch (error) {
    console.error('Error searching for best hero image:', error);
    return null;
  }
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