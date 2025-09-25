import { NextResponse } from 'next/server';
import { searchImages, getFallbackImages } from '@/lib/unsplash';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'nature';

  try {
    console.log(`Testing image search for: "${query}"`);
    
    // Test Unsplash API
    const images = await searchImages(query, 3);
    
    if (images.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'unsplash',
        query,
        count: images.length,
        images: images.map(img => ({
          id: img.id,
          description: img.description || img.alt_description,
          url: img.urls.small,
          user: img.user.name,
        })),
      });
    } else {
      // Test fallback images
      const fallbackImages = getFallbackImages();
      return NextResponse.json({
        success: true,
        source: 'fallback',
        query,
        message: 'No Unsplash images found or API key not configured',
        count: fallbackImages.length,
        images: fallbackImages.map(img => ({
          id: img.id,
          description: img.description || img.alt_description,
          url: img.urls.small,
          user: img.user.name,
        })),
      });
    }
  } catch (error) {
    console.error('Error in test-images endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch images',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}