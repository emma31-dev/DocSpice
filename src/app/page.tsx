import Link from 'next/link'
import { PenTool, Users, Sparkles, ArrowRight, UserPlus } from 'lucide-react'

export default function HeroPage() {
  return (
    <div className="px-6 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Hero Content */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Content Creation
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Text Into
            <span className="block bg-linear-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
              Beautiful Visual Stories
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            DocSpice uses advanced AI to analyze your content and automatically adds stunning, 
            relevant images from Unsplash. Turn plain text into magazine-quality articles in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/create"
              className="flex items-center gap-2 px-8 py-4 bg-linear-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl
                hover:from-blue-700 hover:to-sky-600 transition-all duration-200 shadow-lg hover:shadow-xl
                transform hover:scale-105 text-lg"
            >
              <PenTool className="h-5 w-5" />
              Create Article
              <ArrowRight className="h-5 w-5" />
            </Link>
            
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl
                hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200
                transform hover:scale-105 text-lg"
            >
              <Users className="h-5 w-5" />
              Join Community
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Analysis</h3>
            <p className="text-gray-600">
              Our advanced NLP algorithms analyze your text to understand themes, 
              extract keywords, and identify the perfect visual elements.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-full mb-6">
              <PenTool className="h-8 w-8 text-sky-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Instant Creation</h3>
            <p className="text-gray-600">
              Transform your plain text into beautifully illustrated articles in seconds. 
              No design skills required.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Share & Discover</h3>
            <p className="text-gray-600">
              Publish your articles to our community feed and discover amazing 
              content created by other writers.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-linear-to-r from-blue-600 to-sky-500 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of writers who are already creating beautiful content with DocSpice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/create"
              className="flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl
                hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl
                transform hover:scale-105"
            >
              <PenTool className="h-5 w-5" />
              Try It Free
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-xl
                hover:bg-white/10 transition-all duration-200 border-2 border-white/30
                transform hover:scale-105"
            >
              <UserPlus className="h-5 w-5" />
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
