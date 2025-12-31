-- ============================================
-- Supabase Database Schema for DocSpice Platform Upgrade
-- ============================================
-- Execute this script in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query

-- ============================================
-- Drop existing tables if they exist (for clean upgrade)
-- ============================================
DROP TABLE IF EXISTS articles CASCADE;

-- ============================================
-- Create Users Table (extends Supabase auth.users)
-- ============================================
-- Note: Supabase auth.users table already exists, but we need a users table
-- to store additional user information

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for users
CREATE INDEX IF NOT EXISTS idx_users_user_name ON users(user_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- Create Articles Table (updated schema)
-- ============================================

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  image_links JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for articles table
CREATE INDEX IF NOT EXISTS idx_articles_created_by ON articles(created_by);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles USING gin(to_tsvector('english', title));

-- ============================================
-- Enable Row Level Security
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on articles table
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Users RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Policy 1: Allow public read access to user profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON users FOR SELECT
TO public
USING (true);

-- Policy 2: Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- Articles RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Published articles are viewable by everyone" ON articles;
DROP POLICY IF EXISTS "Authenticated users can publish articles" ON articles;
DROP POLICY IF EXISTS "Users can update own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON articles;

-- Policy 1: Allow public read access to published articles
CREATE POLICY "Published articles are viewable by everyone"
ON articles FOR SELECT
TO public
USING (true);

-- Policy 2: Allow authenticated users to publish articles
CREATE POLICY "Authenticated users can publish articles"
ON articles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Policy 3: Allow users to update their own articles
CREATE POLICY "Users can update own articles"
ON articles FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Policy 4: Allow users to delete their own articles
CREATE POLICY "Users can delete own articles"
ON articles FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- ============================================
-- Create Functions and Triggers
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for articles updated_at
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Create Views for Optimized Queries
-- ============================================

-- View for articles with author information
CREATE OR REPLACE VIEW articles_with_author AS
SELECT 
    a.id,
    a.title,
    a.body,
    a.image_links,
    a.created_by,
    a.created_at,
    a.updated_at,
    u.user_name as author_name,
    u.email as author_email
FROM articles a
LEFT JOIN users u ON a.created_by = u.id;

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Note: This section is commented out for production
-- Uncomment for development/testing purposes

/*
-- Insert sample user profile (requires existing auth.users entry)
INSERT INTO users (id, user_name, email) VALUES
('00000000-0000-0000-0000-000000000001', 'testuser', 'test@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample article
INSERT INTO articles (title, body, image_links, created_by) VALUES
('Sample Article', 'This is a sample article body with some content.', 
 '[{"url": "https://images.unsplash.com/photo-1234567890", "alt": "Sample image", "position": 1}]',
 '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- Verification Queries
-- ============================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('users', 'articles');

-- Check indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('users', 'articles')
ORDER BY tablename, indexname;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'articles');

-- Check RLS policies
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('users', 'articles')
ORDER BY tablename, policyname;

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('users', 'articles');

-- Test the view
SELECT COUNT(*) as article_count FROM articles_with_author;