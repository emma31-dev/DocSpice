'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Clock, Tag, Palette, ExternalLink, Sparkles } from 'lucide-react';
import { ArticleData } from '@/app/api/generate/route';
import { Spinner, TextSkeleton, ImageSkeleton } from '@/components/LoadingComponents';
import { DocSpiceIcon } from '@/components/DocSpiceIcon';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<{[key: string]: boolean}>({});
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleImageLoad = (imageId: string) => {
    setImagesLoaded(prev => ({
      ...prev,
      [imageId]: true
    }));
  };

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        // Simulate loading progress for better UX
        setLoadingProgress(25);
        
        const response = await fetch(`/api/generate?id=${params.id}`);
        setLoadingProgress(50);
        
        if (response.ok) {
          const data = await response.json();
          setLoadingProgress(75);
          setArticle(data);
          setLoadingProgress(100);
        } else {
          setError('Article not found');
        }
      } catch {
        setError('Failed to load article');
      } finally {
        setTimeout(() => setLoading(false), 300); // Small delay for smooth transition
      }
    };

    if (params.id) {
      fetchArticle();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Hero Image Skeleton */}
        <div className="relative h-96 bg-gray-200 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <Spinner size="lg" className="text-white mb-4" />
              <p className="text-lg font-medium">Loading your beautiful article...</p>
              <div className="w-64 bg-white/20 rounded-full h-2 mt-4">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm mt-2 opacity-80">{loadingProgress}% complete</p>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <TextSkeleton lines={8} />
            
            <div className="my-12">
              <ImageSkeleton className="h-80 w-full" />
            </div>
            
            <TextSkeleton lines={6} />
          </div>
        </main>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Article Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The article you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const paragraphs = article.content.split('\n').filter(p => p.trim().length > 0);
  const heroImage = article.images[0];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4" />
            <DocSpiceIcon size={16} className="opacity-70 group-hover:opacity-100 transition-opacity" />
            Back to DocSpice
          </button>
        </div>
      </header>

      {/* Hero Section */}
      {heroImage && (
        <div className="relative h-96 overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src={heroImage.urls.regular}
              alt={heroImage.alt_description || 'Hero image'}
              fill
              className="object-cover transition-opacity duration-500"
              priority
              onLoad={() => handleImageLoad('hero')}
            />
            {!imagesLoaded['hero'] && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <Spinner size="lg" className="text-gray-400" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
            imagesLoaded['hero'] ? 'opacity-100' : 'opacity-70'
          }`}>
            <div className="text-center text-white max-w-4xl mx-auto px-6">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight animate-fade-in">
                {article.title}
              </h1>
              <div className="flex items-center justify-center gap-6 text-white/80 animate-fade-in-delay">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span>{article.images.length} images</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>AI Enhanced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Meta Information */}
        <div className="flex flex-wrap gap-4 mb-8">
          {article.themes.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Themes:</span>
              <div className="flex gap-2">
                {article.themes.map((theme, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none">
          {paragraphs.map((paragraph, index) => {
            // Calculate which image to use (skip hero image at index 0)
            const imageIndex = Math.floor(index / 2) + 1;
            const shouldInsertImage = (index + 1) % 2 === 0 && imageIndex < article.images.length;
            const imageToInsert = shouldInsertImage ? article.images[imageIndex] : null;

            return (
              <div key={index}>
                <p className="text-gray-800 leading-relaxed mb-6 text-lg">
                  {paragraph}
                </p>
                
                {imageToInsert && (
                  <div className="my-12 animate-fade-in-up">
                    <div className="relative h-80 rounded-xl overflow-hidden shadow-lg group">
                      <Image
                        src={imageToInsert.urls.regular}
                        alt={imageToInsert.alt_description || `Image ${imageIndex}`}
                        fill
                        className="object-cover transition-all duration-500 group-hover:scale-105"
                        onLoad={() => handleImageLoad(`inline-${index}`)}
                      />
                      {!imagesLoaded[`inline-${index}`] && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center rounded-xl">
                          <div className="text-center">
                            <Spinner size="md" className="text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500">Loading image...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Loading overlay that fades out */}
                      <div className={`absolute inset-0 bg-white transition-opacity duration-500 ${
                        imagesLoaded[`inline-${index}`] ? 'opacity-0 pointer-events-none' : 'opacity-30'
                      }`}></div>
                    </div>
                    
                    {imageToInsert.description && (
                      <p className={`text-center text-gray-500 text-sm mt-3 italic transition-opacity duration-500 ${
                        imagesLoaded[`inline-${index}`] ? 'opacity-100' : 'opacity-50'
                      }`}>
                        {imageToInsert.description}
                      </p>
                    )}
                    
                    <p className={`text-center text-xs text-gray-400 mt-1 transition-opacity duration-500 ${
                      imagesLoaded[`inline-${index}`] ? 'opacity-100' : 'opacity-50'
                    }`}>
                      Photo by{' '}
                      <a
                        href={`https://unsplash.com/@${imageToInsert.user.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-gray-600 transition-colors"
                      >
                        {imageToInsert.user.name}
                      </a>{' '}
                      on{' '}
                      <a
                        href="https://unsplash.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-gray-600 transition-colors"
                      >
                        Unsplash
                      </a>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Keywords Section */}
        {article.keywords.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Topics</h3>
            <div className="flex flex-wrap gap-2">
              {article.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Image Gallery */}
        {article.images.length > 1 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 animate-fade-in">Image Gallery</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {article.images.slice(1).map((image, index) => (
                <div key={index} className="group animate-fade-in-up" style={{animationDelay: `${index * 100}ms`}}>
                  <div className="relative h-48 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300">
                    <Image
                      src={image.urls.small}
                      alt={image.alt_description || `Gallery image ${index + 2}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onLoad={() => handleImageLoad(`gallery-${index}`)}
                    />
                    {!imagesLoaded[`gallery-${index}`] && (
                      <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                        <Spinner size="sm" className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className={`text-xs text-gray-400 mt-2 text-center transition-opacity duration-300 ${
                    imagesLoaded[`gallery-${index}`] ? 'opacity-100' : 'opacity-50'
                  }`}>
                    Photo by {image.user.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Create Your Own Beautiful Article
            </h3>
            <p className="text-gray-600 mb-6">
              Transform your text into stunning visual stories with DocSpice
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <ExternalLink className="h-5 w-5" />
              Try DocSpice Now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}