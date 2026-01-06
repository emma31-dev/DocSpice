'use client'

import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  currentArticleAtom,
  articlesListAtom,
  articleCreationAtom,
  isLoadingAtom,
  errorMessageAtom,
  feedLoadedAtom
} from '@/atoms'
import type { Article, ArticleCreationState, GeneratedArticle, ImageLink } from '@/atoms'

export function useArticles() {
  const currentArticle = useAtomValue(currentArticleAtom)
  const articlesList = useAtomValue(articlesListAtom)
  const isLoading = useAtomValue(isLoadingAtom)
  const error = useAtomValue(errorMessageAtom)
  const feedLoaded = useAtomValue(feedLoadedAtom)
  
  const setCurrentArticle = useSetAtom(currentArticleAtom)
  const setArticlesList = useSetAtom(articlesListAtom)
  const setIsLoading = useSetAtom(isLoadingAtom)
  const setError = useSetAtom(errorMessageAtom)
  const setFeedLoaded = useSetAtom(feedLoadedAtom)
  const fetchArticles = async (page = 1, limit = 10, force = false) => {
    // If we've already loaded the first page and caller didn't force, skip fetching again
    if (page === 1 && !force && feedLoaded) {
      return { success: true, data: articlesList, pagination: null }
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/elysia/articles/feed?page=${page}&limit=${limit}`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        // Transform the data to match our Article interface
        const articles: Article[] = (data.articles || []).map((article: {
          id: string;
          title: string;
          body: string;
          image_links: ImageLink[];
          created_at: string;
          author_name?: string;
        }) => ({
          ...article,
          author: {
            user_name: article.author_name || 'Unknown'
          }
        }))

        setArticlesList(articles)
        // Mark feed as loaded to prevent repeating requests when page 1 has been fetched
        if (page === 1) setFeedLoaded(true)

        return { success: true, data: articles, pagination: data.pagination }
      } else {
        throw new Error(data.error || 'Failed to fetch articles')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch articles'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchArticleById = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/elysia/articles/${id}`, {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const article: Article = {
          ...data.article,
          author: {
            user_name: data.article.author_name || 'Unknown'
          }
        }
        
        setCurrentArticle(article)
        return { success: true, data: article }
      } else {
        throw new Error(data.error || 'Failed to fetch article')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch article'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const updateArticle = async (id: string, updates: { title: string; body: string; image_links: ImageLink[] }) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/elysia/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const article: Article = {
          ...data.article,
          author: {
            user_name: data.article.author_name || 'Unknown'
          }
        }
        
        setCurrentArticle(article)
        return { success: true, data: article }
      } else {
        throw new Error(data.error || 'Failed to update article')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update article'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteArticle = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/elysia/articles/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Remove from articles list if it exists
        setArticlesList(prev => prev.filter(article => article.id !== id))
        return { success: true, data: data.deleted_article }
      } else {
        throw new Error(data.error || 'Failed to delete article')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete article'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    currentArticle,
    articlesList,
    isLoading,
    error,
    fetchArticles,
    fetchArticleById,
    updateArticle,
    deleteArticle,
    setCurrentArticle,
    setArticlesList
  }
}

export function useArticleCreation() {
  const [creationState, setCreationState] = useAtom(articleCreationAtom)
  
  const updateCreationState = (updates: Partial<ArticleCreationState>) => {
    setCreationState(prev => ({ ...prev, ...updates }))
  }

  const publishArticle = async (generatedArticle: GeneratedArticle) => {
    try {
      updateCreationState({ isPublishing: true, publishError: null })
      
      const response = await fetch('/api/elysia/articles/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: generatedArticle.title,
          body: generatedArticle.body,
          image_links: generatedArticle.images
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        updateCreationState({ 
          isPublishing: false, 
          publishError: null,
          generatedArticle: null,
          content: ''
        })
        
        return { success: true, data: data.article }
      } else {
        throw new Error(data.error || 'Failed to publish article')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish article'
      updateCreationState({ 
        isPublishing: false, 
        publishError: errorMessage 
      })
      return { success: false, error: errorMessage }
    }
  }

  const resetCreationState = () => {
    setCreationState({
      content: '',
      generatedArticle: null,
      isPublishing: false,
      publishError: null
    })
  }

  return {
    creationState,
    updateCreationState,
    publishArticle,
    resetCreationState
  }
}