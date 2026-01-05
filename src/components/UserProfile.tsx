'use client'

import { useState, useEffect } from 'react'
import { User, Calendar } from 'lucide-react'

interface UserProfileProps {
  userId: string
}

export default function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user profile data
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/user/profile/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>User not found</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold">User Profile</h2>
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Member since 2024</span>
          </div>
        </div>
      </div>
    </div>
  )
}