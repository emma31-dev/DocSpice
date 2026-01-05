import { atom } from 'jotai'

// Re-export auth atoms
export * from './auth'

// User and authentication types (matching our API)
export interface User {
  id: string
  user_name: string
  email: string
  created_at: string
}

// Type alias for consistency
export type ApiUser = User

export interface Article {
  id: string
  title: string
  body: string
  image_links: ImageLink[]
  created_by: string
  created_at: string
  views?: number
  word_count?: number
  reading_time?: number
  author?: {
    user_name: string
  }
}

export interface ImageLink {
  url: string
  alt: string
  position: number
  unsplash_id?: string
}

export interface ArticleCreationState {
  content: string
  generatedArticle: GeneratedArticle | null
  isPublishing: boolean
  publishError: string | null
}

export interface GeneratedArticle {
  title: string
  body: string
  images: ProcessedImage[]
}

export interface ProcessedImage {
  url: string
  alt: string
  position: number
  unsplash_id?: string
}

// Article state management
export const currentArticleAtom = atom<Article | null>(null)
export const articlesListAtom = atom<Article[]>([])

// Article creation state
export const articleCreationAtom = atom<ArticleCreationState>({
  content: '',
  generatedArticle: null,
  isPublishing: false,
  publishError: null
})

// UI state atoms
export const isLoadingAtom = atom<boolean>(false)
export const errorMessageAtom = atom<string | null>(null)