'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, User, X } from 'lucide-react'
import { getCachedUserSearch } from '@/lib/api-cache'
import { LoadingSpinner } from '@/components/LoadingComponents'

interface User {
  id: string
  full_name: string
  avatar_url?: string
}

interface UserSearchProps {
  onUserSelect?: (user: User) => void
  placeholder?: string
  className?: string
}

export default function UserSearch({ 
  onUserSelect, 
  placeholder = "Search users...",
  className = ""
}: UserSearchProps) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search users with debouncing
  useEffect(() => {
    if (query.length < 2) {
      setUsers([])
      setIsOpen(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await getCachedUserSearch(query, 10) as { users: User[], query: string }
        setUsers(response.users || [])
        setIsOpen(true)
      } catch (err) {
        console.error('User search error:', err)
        setError('Failed to search users')
        setUsers([])
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleUserSelect = (user: User) => {
    setQuery('')
    setIsOpen(false)
    onUserSelect?.(user)
    inputRef.current?.blur()
  }

  const clearSearch = () => {
    setQuery('')
    setUsers([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            bg-white text-gray-900 placeholder-gray-500
            transition-all duration-200"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-600">Searching...</span>
            </div>
          ) : error ? (
            <div className="px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : users.length > 0 ? (
            <div className="py-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-400 rounded-full flex items-center justify-center flex-shrink-0">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="px-4 py-3 text-sm text-gray-600">
              No users found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}