import { NextRequest, NextResponse } from 'next/server';
import { analyzeText, generateImageSearchQueries } from '@/lib/textAnalysis';
import { searchImagesForQueries, getFallbackImages } from '@/lib/unsplash';
import { randomUUID } from 'crypto';

export interface ArticleData {
  id: string;
  title: string;
  content: string;
  images: any[];
  keywords: string[];
  themes: string[];
  createdAt: string;
}

// In-memory storage for demo purposes
// In production, use a proper database
const articles = new Map<string, ArticleData>();

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Please provide at least 50 characters of text' },
        { status: 400 }
      );
    }

    // Analyze the text
    const analysis = await analyzeText(text);
    
    // Generate image search queries
    const imageQueries = generateImageSearchQueries(analysis);
    
    // Search for images
    let images;
    let imageSource = 'unsplash';
    
    try {
      console.log('Generated image search queries:', imageQueries);
      images = await searchImagesForQueries(imageQueries);
      
      // If no images found or API key not configured, use fallbacks
      if (images.length === 0) {
        console.log('No Unsplash images found, using fallback images');
        images = getFallbackImages();
        imageSource = 'fallback';
      } else {
        console.log(`Successfully fetched ${images.length} images from Unsplash`);
      }
    } catch (error) {
      console.error('Error fetching images, using fallbacks:', error);
      images = getFallbackImages();
      imageSource = 'fallback';
    }
    
    console.log(`Using ${imageSource} images for article generation`);

    // Generate a title from the first sentence or keywords
    const title = generateTitle(text, analysis.keywords);

    // Create article data
    const articleId = randomUUID();
    const articleData: ArticleData = {
      id: articleId,
      title,
      content: text,
      images,
      keywords: analysis.keywords.map(k => k.word),
      themes: analysis.themes,
      createdAt: new Date().toISOString(),
    };

    // Store the article
    articles.set(articleId, articleData);

    return NextResponse.json({ 
      id: articleId,
      title,
      keywords: analysis.keywords.map(k => k.word),
      themes: analysis.themes,
      imageCount: images.length
    });

  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Article ID is required' },
      { status: 400 }
    );
  }

  const article = articles.get(id);
  if (!article) {
    return NextResponse.json(
      { error: 'Article not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(article);
}

function generateTitle(text: string, keywords: any[]): string {
  // Try to extract title from first sentence
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  if (sentences.length > 0) {
    const firstSentence = sentences[0];
    
    // If first sentence is short and looks like a title, use it
    if (firstSentence.length < 100 && !firstSentence.toLowerCase().includes('the following')) {
      return firstSentence;
    }
  }

  // Generate title from keywords
  if (keywords.length > 0) {
    const topKeywords = keywords.slice(0, 3).map(k => k.word);
    const capitalizedKeywords = topKeywords.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    
    return `Exploring ${capitalizedKeywords.join(', ')}`;
  }

  return 'Untitled Article';
}