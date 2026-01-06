import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DocSpiceIcon } from '@/components/DocSpiceIcon'
import AuthForm from '@/components/AuthForm'
import { LoadingSpinner } from '@/components/LoadingComponents'

export const metadata: Metadata = {
  title: 'Sign Up - DocSpice',
  description: 'Create your DocSpice account to start publishing illustrated articles.',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-sky-50">
      {/* Header */}
      <header className="px-6 py-6">
        <div className="max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-linear-to-br from-blue-500 to-sky-400 rounded-xl text-white">
                <DocSpiceIcon size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
                  DocSpice
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-8">
              <Suspense fallback={<LoadingSpinner />}>
                <AuthForm mode="signup" />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}