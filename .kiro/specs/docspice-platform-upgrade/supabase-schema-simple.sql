-- ============================================
-- Simplified Supabase Database Schema for DocSpice
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- Create Users Table
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for users
CREATE INDEX idx_users_user_name ON users(user_name);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- Create Articles Table
-- ============================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  image_links JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views 
);

-- Add indexes for articles table
CREATE INDEX idx_articles_created_by ON articles(created_by);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Users RLS Policies
-- ============================================
CREATE POLICY "Public profiles are viewable by everyone"
ON users FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- Articles RLS Policies
-- ============================================
CREATE POLICY "Published articles are viewable by everyone"
ON articles FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can publish articles"
ON articles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own articles"
ON articles FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own articles"
ON articles FOR DELETE
TO authenticated
USING (auth.uid() = created_by);