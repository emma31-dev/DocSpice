'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';
import { Spinner, TextSkeleton, ImageSkeleton } from '@/components/LoadingComponents';

interface ImageLink {
  url: string;
  alt: string;
  position: number;
  unsplash_id?: string;
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { currentArticle, isLoading, error, fetchArticleById } = useArticles();
  const [imagesLoaded, setImagesLoaded] = useState<{[key: string]: boolean}>({});

  const handleImageLoad = (imageId: string) => {
    setImagesLoaded(prev => ({
      ...prev,
      [imageId]: true
    }));
  };

  useEffect(() => {
    const loadArticle = async () => {
      if (params.id && typeof params.id === 'string') {
        await fetchArticleById(params.id);
      }
    };

    loadArticle();
  }, [params.id, fetchArticleById]);

  if (isLoading) {
    return (
        <div className="px-6 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <div className="w-3/4 h-10 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                    <div className="w-1/2 h-6 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <div className="w-3/4 h-12 bg-gray-200 rounded animate-pulse mb-6"></div>
                        <TextSkeleton lines={4} />
                        <ImageSkeleton className="h-80 w-full my-8" />
                        <TextSkeleton lines={5} />
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (error || !currentArticle) {
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

  // Split into paragraphs by double newlines to match the generator's behavior
  const paragraphs = (currentArticle.body || '').split('\n\n').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
  const images = currentArticle.image_links as ImageLink[] || [];

  return (
    <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
                    {(() => {
                      const fallbackAuthorName = (currentArticle as unknown as Record<string, unknown>)['author_name'] as string | undefined
                      const fallbackAuthorEmail = (currentArticle as unknown as Record<string, unknown>)['author_email'] as string | undefined
                        return (
                          <span>By {currentArticle.author?.user_name || (currentArticle.created_by ? currentArticle.created_by.slice(0,8) : fallbackAuthorName || (fallbackAuthorEmail ? fallbackAuthorEmail.split('@')[0] : 'Anonymous'))}</span>
                      )
                    })()}
                <span>&bull;</span>
                <span>{new Date(currentArticle.created_at).toLocaleDateString()}</span>
                <span>&bull;</span>
                <span>{(currentArticle.views ?? 0).toLocaleString()} {((currentArticle.views ?? 0) === 1) ? 'Read' : 'Reads'}</span>
              </div>
            </div>

            <article className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  {currentArticle.title}
                </h1>
                
                <div className="prose prose-lg max-w-none">
                  {paragraphs.map((paragraph: string, index: number) => {
                    const imagesForThisParagraph = images.filter(
                      (img: ImageLink) => img.position === index + 1
                    )
                    
                    return (
                      <div key={index}>
                        <p className="text-gray-700 leading-relaxed mb-6">
                          {paragraph}
                        </p>
                        {imagesForThisParagraph.map((image, imgIndex) => (
                          <div key={imgIndex} className="my-8">
                            <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden">
                              <Image
                                src={image.url}
                                alt={image.alt}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                                onLoad={() => handleImageLoad(`img-${index}-${imgIndex}`)}
                              />
                               {!imagesLoaded[`img-${index}-${imgIndex}`] && (
                                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                                    <Spinner size="lg" className="text-gray-400" />
                                </div>
                               )}
                            </div>
                            <p className="text-sm text-gray-500 mt-2 text-center italic">
                              {image.alt}
                            </p>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </article>

            <div className="text-center mt-8">
                <button
                    onClick={() => router.push('/create')}
                    className="px-8 py-4 bg-linear-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl
                    hover:from-blue-700 hover:to-sky-600 
                    transition-all duration-200 shadow-lg hover:shadow-xl
                    transform hover:scale-105
                    flex items-center gap-2 text-lg mx-auto"
                >
                    Create Your Own Article
                </button>
            </div>
        </div>
    </div>
  );
}
