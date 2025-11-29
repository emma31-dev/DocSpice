import React from 'react';
import { Loader2, Sparkles, Brain, Image as ImageIcon, FileText } from 'lucide-react';

// Spinner component with different sizes
export const Spinner = ({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  className?: string; 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

// Loading skeleton for text content
export const TextSkeleton = ({ lines = 3 }: { lines?: number }) => {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          {i === lines - 1 && <div className="h-4 bg-gray-200 rounded w-4/6"></div>}
        </div>
      ))}
    </div>
  );
};

// Loading skeleton for images
export const ImageSkeleton = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`bg-gray-200 rounded-lg animate-pulse flex items-center justify-center ${className}`}>
      <ImageIcon className="h-12 w-12 text-gray-400" />
    </div>
  );
};

// Progress indicator with steps
export const ProgressIndicator = ({ 
  currentStep, 
  totalSteps, 
  steps,
  className = '' 
}: { 
  currentStep: number; 
  totalSteps: number;
  steps: string[];
  className?: string;
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-gradient-to-r from-blue-500 to-sky-400 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
      
      {/* Step indicator */}
      <div className="flex justify-between text-sm">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center space-x-2 ${
              index < currentStep 
                ? 'text-green-600' 
                : index === currentStep 
                ? 'text-blue-600 font-medium' 
                : 'text-gray-400'
            }`}
          >
            {index < currentStep ? (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : index === currentStep ? (
              <Spinner size="sm" className="text-blue-600" />
            ) : (
              <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
            )}
            <span className="hidden sm:inline">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced loading button
export const LoadingButton = ({
  isLoading,
  loadingText,
  children,
  className = '',
  ...props
}: {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" className="text-white" />
          {loadingText || 'Loading...'}
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Article generation progress modal component
export const ArticleGenerationProgress = ({ 
  currentStep, 
  className = '' 
}: { 
  currentStep: number; 
  className?: string; 
}) => {
  const steps = [
    'Analyzing text',
    'Extracting keywords', 
    'Finding images',
    'Creating article'
  ];

  const stepIcons = [Brain, FileText, ImageIcon, Sparkles];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-200 max-w-2xl w-full animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Creating Your Beautiful Article
          </h3>
          <p className="text-gray-600">
            Please wait while we transform your content...
          </p>
        </div>

        <ProgressIndicator 
          currentStep={currentStep} 
          totalSteps={steps.length}
          steps={steps}
          className="mb-6"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={index}
                className={`text-center p-4 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-50 border-2 border-blue-200 scale-105' 
                    : isCompleted
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div className={`mx-auto mb-2 p-2 rounded-full w-12 h-12 flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-100 text-blue-600'
                    : isCompleted  
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {isActive ? (
                    <Spinner size="sm" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <p className={`text-sm font-medium ${
                  isActive 
                    ? 'text-blue-800' 
                    : isCompleted
                    ? 'text-green-800' 
                    : 'text-gray-600'
                }`}>
                  {step}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Adding the perfect images to your story...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Image loading component with fallback
export const LoadingImage = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  onLoad,
  onError,
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
} & React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
    onError?.();
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <Spinner size="md" className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">Loading image...</p>
          </div>
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        {...props}
      />
      
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
};