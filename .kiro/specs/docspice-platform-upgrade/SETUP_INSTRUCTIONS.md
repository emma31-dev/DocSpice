# DocSpice Platform Upgrade Setup Instructions

## Database Setup

### 1. Supabase Database Schema

Execute the SQL script in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase-schema.sql`
5. Execute the script

This will create:
- `user_profiles` table for extended user information
- `articles` table with the new schema for published articles
- Row Level Security policies for both tables
- Indexes for optimal query performance
- Triggers for automatic timestamp updates
- A view for optimized article queries with author information

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and update the following variables:

```bash
# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Unsplash API (required for image search)
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your-unsplash-access-key

# Site Configuration (optional, defaults to localhost:3000)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Backend API

The Elysia backend is now integrated into the Next.js application and will be available at:

- Base URL: `http://localhost:3000/api`
- Swagger Documentation: `http://localhost:3000/api/swagger`

### 4. API Endpoints

#### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/user` - Get current user

#### Articles
- `POST /api/articles/publish` - Publish an article
- `GET /api/articles/feed` - Get article feed with pagination
- `GET /api/articles/:id` - Get specific article
- `PUT /api/articles/:id` - Update article (owner only)
- `DELETE /api/articles/:id` - Delete article (owner only)

#### Images
- `GET /api/images/search` - Search Unsplash images
- `POST /api/images/process` - Process and optimize images

### 5. Testing the Setup

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Test the API health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. View API documentation:
   Open `http://localhost:3000/api/swagger` in your browser

### 6. Database Verification

After running the schema script, you can verify the setup with these queries in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('user_profiles', 'articles');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('user_profiles', 'articles');

-- Test the articles view
SELECT COUNT(*) as article_count FROM articles_with_author;
```

## Next Steps

With the database schema and backend infrastructure now set up, you can proceed to implement:

1. Jotai state management system (Task 2)
2. Authentication system with Elysia backend (Task 3)
3. Application routing and pages restructure (Task 4)
4. Article creation with publish functionality (Task 5)
5. Article feed and home page (Task 6)

The backend API is ready to support all these features with proper authentication, validation, and error handling.