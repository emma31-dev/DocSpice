import { NextRequest, NextResponse } from 'next/server';
import { analyzeText, generateImageSearchQueries, generateOptimizedImageSearchQueries, KeywordData } from '@/lib/textAnalysis';
import { searchImagesForQueries, getFallbackImages, UnsplashImage } from '@/lib/unsplash';
import { randomUUID } from 'crypto';

export interface ArticleData {
  id: string;
  title: string;
  content: string;
  images: UnsplashImage[];
  keywords: string[];
  themes: string[];
  createdAt: string;
}

// In-memory storage for demo purposes
// In production, use a proper database
const articles = new Map<string, ArticleData>();

export async function POST(request: NextRequest) {
  try {
    const { text, title: providedTitle } = await request.json();

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Please provide at least 50 characters of text' },
        { status: 400 }
      );
    }

    // Analyze the text
    const analysis = await analyzeText(text);
    
    // Generate image search queries using optimized function
    let imageQueries: string[];
    try {
      imageQueries = generateOptimizedImageSearchQueries(analysis);
    } catch (error) {
      console.error('Error with optimized query generation, falling back to basic:', error);
      imageQueries = generateImageSearchQueries(analysis);
    }
    
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

    // Use provided title or generate one
    const title = providedTitle?.trim() || generateTitle(text, analysis.keywords);

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

function generateTitle(text: string, keywords: KeywordData[]): string {
  const paragraphs = text.split('\n').map(p => p.trim()).filter(p => p.length > 10);
  const searchText = paragraphs.slice(0, 2).join(' ').toLowerCase();
  
  // Look for phrases starting with 'the' followed by descriptive words
  const thePattern = /\bthe\s+([a-z]+(?:\s+[a-z]+){0,3})\s+(?:woman|man|mother|father|farmer|nurse|teacher|doctor|widow|child|boy|girl|student|worker|person|family|couple)/g;
  
  let match;
  while ((match = thePattern.exec(searchText)) !== null) {
    const phrase = `The ${match[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    const words = phrase.split(' ');
    if (words.length >= 2 && words.length <= 5) {
      return phrase;
    }
  }
  
  // Fallback: look for any 'the' + 2-4 words
  const simplePattern = /\bthe\s+([a-z]+(?:\s+[a-z]+){1,3})/g;
  while ((match = simplePattern.exec(searchText)) !== null) {
    const phrase = `The ${match[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    const words = phrase.split(' ');
    if (words.length >= 3 && words.length <= 5) {
      return phrase;
    }
  }
  
  // Final fallback to keywords
  if (keywords.length > 0) {
    return keywords.slice(0, 2).map(k => k.word.charAt(0).toUpperCase() + k.word.slice(1)).join(' ');
  }

  return 'Untitled Article';
}