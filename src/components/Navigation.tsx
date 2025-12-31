'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAtom } from 'jotai'
import { appUserAtom } from '@/atoms/auth'
import { useAuth } from '@/hooks/useAuth'
import { DocSpiceIcon } from '@/components/DocSpiceIcon'
import { 
  LogIn, 
  UserPlus, 
  User, 
  Home, 
  PenTool, 
  LogOut, 
  Menu, 
  X,
  Plus
} from 'lucide-react'

interface NavigationProps {
  className?: string
}

export default function Navigation({ className = '' }: NavigationProps) {
  const [user] = useAtom(appUserAtom)
  const { loading: authLoading, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Update loading state based on auth system
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false)
    }
  }, [authLoading])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const NavLink = ({ 
    href, 
    children, 
    icon: Icon, 
    onClick,
    variant = 'default'
  }: {
    href?: string
    children: React.ReactNode
    icon: React.ComponentType<{ className?: string }>
    onClick?: () => void
    variant?: 'default' | 'primary' | 'danger'
  }) => {
    const baseClasses = "flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-all duration-200"
    
    const variantClasses = {
      default: `text-gray-700 hover:text-blue-600 hover:bg-blue-50 ${
        href && isActive(href) ? 'text-blue-600 bg-blue-50' : ''
      }`,
      primary: "bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-600 shadow-lg hover:shadow-xl transform hover:scale-105",
      danger: "text-red-700 hover:text-red-800 hover:bg-red-50"
    }

    const classes = `${baseClasses} ${variantClasses[variant]}`

    if (onClick) {
      return (
        <button onClick={onClick} className={classes}>
          <Icon className="h-4 w-4" />
          {children}
        </button>
      )
    }

    if (href) {
      return (
        <Link href={href} className={classes}>
          <Icon className="h-4 w-4" />
          {children}
        </Link>
      )
    }

    return null
  }

  return (
    <header className={`px-6 py-6 border-b border-gray-200 bg-white/50 backdrop-blur-sm ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={user ? "/home" : "/"} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-sky-400 rounded-xl text-white">
              <DocSpiceIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
                DocSpice
              </h1>
              <p className="text-sm text-gray-600">Beautiful Articles, Beautifully Illustrated</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <div className="w-20 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            ) : user ? (
              // Authenticated Navigation
              <>
                <NavLink href="/home" icon={Home}>
                  Home
                </NavLink>
                <NavLink href="/create" icon={PenTool}>
                  Create
                </NavLink>
                <NavLink href="/profile" icon={User}>
                  Profile
                </NavLink>
                <NavLink onClick={handleSignOut} icon={LogOut} variant="danger">
                  Sign Out
                </NavLink>
              </>
            ) : (
              // Anonymous Navigation
              <>
                <NavLink href="/create" icon={PenTool}>
                  Try It Free
                </NavLink>
                <NavLink href="/auth/signin" icon={LogIn}>
                  Sign In
                </NavLink>
                <NavLink href="/auth/signup" icon={UserPlus} variant="primary">
                  Sign Up
                </NavLink>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-6 pt-6 border-t border-gray-200">
            <nav className="flex flex-col gap-2">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ) : user ? (
                // Authenticated Mobile Navigation
                <>
                  <NavLink href="/home" icon={Home}>
                    Home Feed
                  </NavLink>
                  <NavLink href="/create" icon={Plus}>
                    Create Article
                  </NavLink>
                  <NavLink href="/profile" icon={User}>
                    My Profile
                  </NavLink>
                  <div className="border-t border-gray-200 my-2"></div>
                  <NavLink onClick={handleSignOut} icon={LogOut} variant="danger">
                    Sign Out
                  </NavLink>
                </>
              ) : (
                // Anonymous Mobile Navigation
                <>
                  <NavLink href="/create" icon={PenTool}>
                    Try DocSpice Free
                  </NavLink>
                  <NavLink href="/auth/signin" icon={LogIn}>
                    Sign In
                  </NavLink>
                  <NavLink href="/auth/signup" icon={UserPlus} variant="primary">
                    Create Account
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}