'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, Sparkles, Image as ImageIcon } from 'lucide-react';
import { ArticleGenerationProgress, LoadingButton } from '@/components/LoadingComponents';
import { DocSpiceIcon } from '@/components/DocSpiceIcon';

export default function Home() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const router = useRouter();

  const simulateProgress = () => {
    setLoadingStep(0);
    
    // Step 1: Analyzing text
    setTimeout(() => setLoadingStep(1), 500);
    
    // Step 2: Extracting keywords  
    setTimeout(() => setLoadingStep(2), 1200);
    
    // Step 3: Finding images
    setTimeout(() => setLoadingStep(3), 2000);
    
    // Step 4: Creating article (will be updated when API responds)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setShowProgress(true);
    simulateProgress();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, title }),
      });

      if (response.ok) {
        const data = await response.json();
        setLoadingStep(4); // Final step
        
        // Brief delay to show completion
        setTimeout(() => {
          router.push(`/article/${data.id}`);
        }, 800);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to generate article'}`);
      }
    } catch (error) {
      console.error('Error generating article:', error);
      alert('Failed to connect to the server. Please try again.');
    } finally {
      // Reset states after a delay if there was an error
      setTimeout(() => {
        setIsLoading(false);
        setShowProgress(false);
        setLoadingStep(0);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Header */}
      <header className="px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-sky-400 rounded-xl text-white">
              <DocSpiceIcon size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
              DocSpice
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">
            Transform your text into beautiful, illustrated articles
          </p>
          <p className="text-gray-500">
            Paste your content and watch as we add stunning visuals to enhance your story
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Show progress when loading */}
          {showProgress && (
            <ArticleGenerationProgress 
              currentStep={loadingStep}
              className="mb-8"
            />
          )}
          
          {/* Hide form when showing progress */}
          <div className={`transition-all duration-500 ${showProgress ? 'opacity-50 pointer-events-none scale-95' : 'opacity-100'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Article Title</h2>
                </div>
              </div>
              <div className="p-6">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your article title (optional - we'll generate one if left empty)"
                  className="w-full border-0 outline-none text-gray-700 placeholder-gray-400 text-lg font-medium"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Text Input Area */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Your Content</h2>
                </div>
              </div>
              <div className="p-6">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your text here... Share your story, article, blog post, or any content you'd like to enhance with beautiful visuals. The more descriptive your text, the better images we can find to complement it!"
                  className="w-full h-80 resize-none border-0 outline-none text-gray-700 placeholder-gray-400 text-base leading-relaxed"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <PenTool className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Smart Analysis</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Our AI analyzes your content to identify key themes and concepts for perfect image matching
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-sky-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Beautiful Images</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  High-quality images from Unsplash automatically selected to enhance your content
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Instant Magic</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Transform plain text into visually stunning articles in seconds
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <LoadingButton
                type="submit"
                disabled={!text.trim() || isLoading}
                isLoading={isLoading}
                loadingText="Creating Your Article..."
              >
                <Sparkles className="h-5 w-5" />
                Transform with DocSpice
              </LoadingButton>
            </div>
          </form>
          </div>
        </div>
      </main>
    </div>
  );
}
