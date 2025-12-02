-- ============================================
-- Supabase Setup Script for Article Creation Tool
-- ============================================
-- Execute this script in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query

-- ============================================
-- TASK 3.1: Create articles table
-- ============================================

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for user_id and created_at columns
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- ============================================
-- TASK 3.2: Configure Row Level Security policies
-- ============================================

-- Enable RLS on articles table
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public read access" ON articles;
DROP POLICY IF EXISTS "Allow authenticated insert" ON articles;
DROP POLICY IF EXISTS "Allow users to update own articles" ON articles;
DROP POLICY IF EXISTS "Allow users to delete own articles" ON articles;

-- Policy 1: Allow public SELECT access
CREATE POLICY "Allow public read access"
ON articles FOR SELECT
TO public
USING (true);

-- Policy 2: Allow authenticated users to INSERT with user_id check
CREATE POLICY "Allow authenticated insert"
ON articles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow users to UPDATE their own articles
CREATE POLICY "Allow users to update own articles"
ON articles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Allow users to DELETE their own articles
CREATE POLICY "Allow users to delete own articles"
ON articles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- TASK 3.4: Configure storage bucket policies
-- ============================================
-- Note: Task 3.3 (creating the bucket) must be done via Supabase Dashboard UI
-- After creating the bucket, execute these storage policies:

-- Drop existing storage policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Policy 1: Allow public read access to images
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article_images');

-- Policy 2: Allow authenticated users to upload with user folder restriction
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'article_images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify your setup:

-- Check if articles table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'articles';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'articles';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'articles';

-- Check RLS policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'articles';

-- Check storage policies
SELECT policyname, definition 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
