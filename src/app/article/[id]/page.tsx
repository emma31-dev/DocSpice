'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Clock, Tag, Palette, ExternalLink, Sparkles, Share2 } from 'lucide-react';
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

  // Share functionality
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = article.title;
  const shareText = `Check out this article: ${article.title}`;

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedText = encodeURIComponent(shareText);

    const shareUrls: { [key: string]: string } = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      // Instagram doesn't support direct web sharing, so we'll copy to clipboard
      instagram: shareUrl,
    };

    if (platform === 'instagram') {
      // Copy to clipboard for Instagram
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied! You can now paste it in Instagram.');
      });
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

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
            const isImageOnLeft = imageIndex % 2 === 0;

            return (
              <div key={index}>
                {imageToInsert ? (
                  // Side-by-side layout on large screens
                  <div className={`my-12 animate-fade-in-up flex flex-col lg:flex-row gap-8 items-center ${
                    isImageOnLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}>
                    {/* Image Section */}
                    <div className="w-full lg:w-1/2 flex-shrink-0">
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

                    {/* Text Section */}
                    <div className="w-full lg:w-1/2">
                      <p className="text-gray-800 leading-relaxed text-lg">
                        {paragraph}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Text-only paragraph
                  <p className="text-gray-800 leading-relaxed mb-6 text-lg">
                    {paragraph}
                  </p>
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

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Share2 className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Share This Article</h3>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* WhatsApp */}
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl hover:bg-[#20BA5A] transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                aria-label="Share on WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-2 px-6 py-3 bg-[#1877F2] text-white rounded-xl hover:bg-[#166FE5] transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                aria-label="Share on Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>

              {/* X (Twitter) */}
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                aria-label="Share on X"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X
              </button>

              {/* Instagram */}
              <button
                onClick={() => handleShare('instagram')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                aria-label="Copy link for Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Share this article with your friends and followers
            </p>
          </div>
        </div>

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