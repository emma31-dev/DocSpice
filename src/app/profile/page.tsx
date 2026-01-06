'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/LoadingComponents'
import { User, Calendar, Mail, PenTool, Home, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { appUser, isAuthenticated, loading: authLoading, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/profile')
      return
    }

    // Set profile data from auth state
    if (!authLoading && appUser) {
      setIsLoading(false)
    } else if (!authLoading && !appUser && isAuthenticated) {
      setError('Failed to load profile information')
      setIsLoading(false)
    }
  }, [appUser, isAuthenticated, authLoading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !appUser) {
    return (
      <div className="px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-600 font-medium">{error || 'Profile not found'}</p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Profile Information</h2>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-sky-400 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {appUser.user_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {appUser.user_name}
                    </h3>
                    <p className="text-gray-600">Content Creator</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email Address</p>
                      <p className="text-gray-900">{appUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Member Since</p>
                      <p className="text-gray-900">
                        {new Date(appUser.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">User ID</p>
                      <p className="text-gray-900 font-mono text-sm">{appUser.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-4">
                <Link
                  href="/create"
                  className="flex items-center gap-3 w-full p-3 text-left bg-blue-50 hover:bg-blue-100 
                    text-blue-700 rounded-xl transition-colors"
                >
                  <PenTool className="h-5 w-5" />
                  <span className="font-medium">Create Article</span>
                </Link>
                
                <Link
                  href="/home"
                  className="flex items-center gap-3 w-full p-3 text-left bg-gray-50 hover:bg-gray-100 
                    text-gray-700 rounded-xl transition-colors"
                >
                  <Home className="h-5 w-5" />
                  <span className="font-medium">View Feed</span>
                </Link>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Account</h3>
              </div>
              <div className="p-6 space-y-4">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full p-3 text-left bg-red-50 hover:bg-red-100 
                    text-red-700 rounded-xl transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>

            {/* Stats Card (Placeholder for future features) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Statistics</h3>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                  <p className="text-gray-600 text-sm">Articles Published</p>
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Start creating articles to see your stats!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}