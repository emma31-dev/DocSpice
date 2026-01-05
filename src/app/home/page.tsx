'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useArticles } from '@/hooks/useArticles';
import { SuccessMessage } from '@/components/SuccessMessage';
import { ArticleGrid } from '@/components/ArticleCard';
import ErrorMessage from '@/components/ErrorMessage';
import { Spinner } from '@/components/LoadingComponents';
import Link from 'next/link';
import { PenTool, Plus } from 'lucide-react';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { articlesList, isLoading, error, fetchArticles } = useArticles();
  
  const success = searchParams.get('success');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/home');
      return;
    }

    if (isAuthenticated) {
      fetchArticles(1, 12);
    }
  }, [isAuthenticated, authLoading, router, fetchArticles]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.user_name || user?.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600">
            Discover the latest articles from our community
          </p>
        </div>

        {/* Success Message */}
        {success === 'true' && (
          <div className="mb-8">
            <SuccessMessage message="Article published successfully! 🎉" />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <Spinner size="lg" className="mb-4" />
            <p className="text-gray-600">Loading articles...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorMessage 
            title="Error loading articles"
            message={error}
            onRetry={() => fetchArticles(1, 12)}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && (!articlesList || articlesList.length === 0) && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <PenTool className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Articles Yet</h2>
            <p className="text-gray-600 mb-6">
              Be the first to create an article and share your story with the community!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl
                hover:from-blue-700 hover:to-sky-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Create Your First Article
            </Link>
          </div>
        )}

        {/* Articles Grid */}
        {!isLoading && !error && articlesList && articlesList.length > 0 && (
          <>
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Community Articles</h3>
              <p className="text-gray-600">
                {articlesList.length} {articlesList.length === 1 ? 'article' : 'articles'} published by our community
              </p>
            </div>

            <ArticleGrid articles={articlesList} />

            {/* Load More Section (Placeholder for future pagination) */}
            {articlesList.length >= 12 && (
              <div className="text-center mt-12">
                <button
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl
                    hover:bg-gray-200 transition-all duration-200 border border-gray-200"
                  disabled
                >
                  Load More Articles (Coming Soon)
                </button>
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-sky-500 rounded-3xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Share Your Story?</h3>
          <p className="text-lg mb-6 opacity-90">
            Transform your ideas into beautiful illustrated articles with AI-powered image matching.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl
              hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl
              transform hover:scale-105"
          >
            <PenTool className="h-5 w-5" />
            Create New Article
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}