'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { createIntersectionObserver, preloadImage } from '@/lib/performance'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  quality?: number
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  quality = 75,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return

    const observer = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, isInView])

  // Preload critical images
  useEffect(() => {
    if (priority && src) {
      preloadImage(src).catch(() => {
        setHasError(true)
      })
    }
  }, [priority, src])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  const generateBlurDataURL = (width: number, height: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Create a simple gradient blur placeholder
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#f3f4f6')
      gradient.addColorStop(1, '#e5e7eb')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }
    
    return canvas.toDataURL()
  }

  const defaultBlurDataURL = blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined)

  if (hasError) {
    return (
      <div 
        ref={imgRef}
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Image not available</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {!isLoaded && isInView && (
        <div 
          className="absolute inset-0 loading-skeleton animate-gentle-pulse"
          style={{ width, height }}
        />
      )}
      
      {/* Actual image */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={defaultBlurDataURL}
          sizes={sizes}
          quality={quality}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      )}
      
      {/* Overlay for better text readability if needed */}
      {isLoaded && className.includes('overlay') && (
        <div className="absolute inset-0 bg-black bg-opacity-20" />
      )}
    </div>
  )
}

// Specialized components for common use cases
export function HeroImage(props: Omit<OptimizedImageProps, 'priority' | 'sizes'>) {
  return (
    <OptimizedImage
      {...props}
      priority={true}
      sizes="100vw"
      quality={85}
    />
  )
}

export function ArticleImage(props: Omit<OptimizedImageProps, 'sizes'>) {
  return (
    <OptimizedImage
      {...props}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
      quality={80}
    />
  )
}

export function ThumbnailImage(props: Omit<OptimizedImageProps, 'sizes'>) {
  return (
    <OptimizedImage
      {...props}
      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      quality={70}
    />
  )
}

export function AvatarImage(props: Omit<OptimizedImageProps, 'sizes' | 'className'>) {
  return (
    <OptimizedImage
      {...props}
      sizes="(max-width: 768px) 64px, 80px"
      quality={85}
      className="rounded-full"
    />
  )
}