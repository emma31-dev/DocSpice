'use client'

import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { createClient } from '@/lib/supabase/client'
import {
  currentArticleAtom,
  articlesListAtom,
  articleCreationAtom,
  isLoadingAtom,
  errorMessageAtom
} from '@/atoms'
import type { Article, ArticleCreationState, GeneratedArticle } from '@/atoms'

export function useArticles() {
  const currentArticle = useAtomValue(currentArticleAtom)
  const articlesList = useAtomValue(articlesListAtom)
  const isLoading = useAtomValue(isLoadingAtom)
  const error = useAtomValue(errorMessageAtom)
  
  const setCurrentArticle = useSetAtom(currentArticleAtom)
  const setArticlesList = useSetAtom(articlesListAtom)
  const setIsLoading = useSetAtom(isLoadingAtom)
  const setError = useSetAtom(errorMessageAtom)

  const fetchArticles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          body,
          image_links,
          created_by,
          created_at,
          users!articles_created_by_fkey (
            user_name
          )
        `)
        .order('created_at', { ascending: false })
      
      if (fetchError) {
        throw fetchError
      }
      
      // Transform the data to match our Article interface
      const articles: Article[] = data.map(article => {
        const users = article.users as { user_name: string } | { user_name: string }[] | null
        const userName = Array.isArray(users) ? users[0]?.user_name : users?.user_name
        
        return {
          ...article,
          author: {
            user_name: userName || 'Unknown'
          }
        }
      })
      
      setArticlesList(articles)
      return { success: true, data: articles }
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
      
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          body,
          image_links,
          created_by,
          created_at,
          users!articles_created_by_fkey (
            user_name
          )
        `)
        .eq('id', id)
        .single()
      
      if (fetchError) {
        throw fetchError
      }
      
      // Transform the data to match our Article interface
      const users = data.users as { user_name: string } | { user_name: string }[] | null
      const userName = Array.isArray(users) ? users[0]?.user_name : users?.user_name
      
      const article: Article = {
        ...data,
        author: {
          user_name: userName || 'Unknown'
        }
      }
      
      setCurrentArticle(article)
      return { success: true, data: article }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch article'
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
      
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }
      
      // Prepare article data for database
      const articleData = {
        title: generatedArticle.title,
        body: generatedArticle.body,
        image_links: generatedArticle.images,
        created_by: user.id
      }
      
      const { data, error: publishError } = await supabase
        .from('articles')
        .insert(articleData)
        .select(`
          id,
          title,
          body,
          image_links,
          created_by,
          created_at,
          users!articles_created_by_fkey (
            user_name
          )
        `)
        .single()
      
      if (publishError) {
        throw publishError
      }
      
      // Transform the data to match our Article interface
      const users = data.users as { user_name: string } | { user_name: string }[] | null
      const userName = Array.isArray(users) ? users[0]?.user_name : users?.user_name
      
      const publishedArticle: Article = {
        ...data,
        author: {
          user_name: userName || 'Unknown'
        }
      }
      
      updateCreationState({ 
        isPublishing: false, 
        publishError: null,
        generatedArticle: null,
        content: ''
      })
      
      return { success: true, data: publishedArticle }
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