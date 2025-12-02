# Requirements Document

## Introduction

This document specifies the requirements for a full-stack article creation tool that enables users to create, store, and display articles with titles, content, and cover images. The system leverages Next.js 15 with App Router for the frontend and Supabase for backend services including database, storage, and authentication.

## Glossary

- **Article System**: The complete full-stack application for creating and displaying articles
- **Supabase Backend**: The backend-as-a-service platform providing database, storage, and authentication
- **Article Entity**: A data structure containing title, content, cover image, and metadata
- **Storage Bucket**: A Supabase storage container for uploaded image files
- **RLS Policy**: Row Level Security policy that controls data access at the database level
- **Server Action**: A Next.js server-side function that handles form submissions
- **Server Component**: A React component that renders on the server
- **Client Component**: A React component that renders in the browser

## Requirements

### Requirement 1: Database Schema and Storage

**User Story:** As a developer, I want a properly structured database and storage system, so that article data and images can be stored securely and efficiently.

#### Acceptance Criteria

1. THE Article System SHALL store article records with fields for id (uuid), created_at (timestamptz), title (text), content (text), image_url (text), and user_id (uuid)
2. THE Article System SHALL maintain a foreign key relationship between article user_id and auth.users(id)
3. THE Article System SHALL provide a public storage bucket named "article_images" for cover image files
4. THE Article System SHALL generate unique file paths using the pattern "user_id/timestamp-filename" for uploaded images
5. THE Article System SHALL retrieve public URLs for uploaded images from the storage bucket

### Requirement 2: Row Level Security

**User Story:** As a system administrator, I want granular access control on articles, so that data security is maintained while allowing appropriate public access.

#### Acceptance Criteria

1. THE Article System SHALL allow SELECT operations on articles for all users including anonymous users
2. THE Article System SHALL allow INSERT operations on articles only for authenticated users
3. WHEN a user attempts to UPDATE an article, THE Article System SHALL verify that the user_id matches the authenticated user's ID
4. WHEN a user attempts to DELETE an article, THE Article System SHALL verify that the user_id matches the authenticated user's ID
5. THE Article System SHALL deny all unauthorized database operations through RLS policies

### Requirement 3: Supabase Client Configuration

**User Story:** As a developer, I want properly configured Supabase clients for different contexts, so that authentication and data access work correctly across server and client components.

#### Acceptance Criteria

1. THE Article System SHALL provide a client-side Supabase client for use in Client Components
2. THE Article System SHALL provide a server-side Supabase client for use in Server Components and Server Actions
3. THE Article System SHALL implement middleware to manage authentication sessions across requests
4. THE Article System SHALL load Supabase configuration from environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
5. THE Article System SHALL maintain authentication state across page navigations

### Requirement 4: Article Creation Interface

**User Story:** As a content creator, I want a form to create articles with title, content, and cover image, so that I can publish my content easily.

#### Acceptance Criteria

1. THE Article System SHALL provide input fields for article title, content, and cover image file
2. WHEN a user submits the article form, THE Article System SHALL display a loading state during processing
3. THE Article System SHALL validate that all required fields are provided before submission
4. WHEN form submission fails, THE Article System SHALL display an error message to the user
5. THE Article System SHALL use a Server Action to process form submissions

### Requirement 5: Article Creation Processing

**User Story:** As a content creator, I want my article and image to be saved securely, so that my content is persisted and accessible.

#### Acceptance Criteria

1. WHEN processing an article submission, THE Article System SHALL verify the user is authenticated
2. THE Article System SHALL upload the cover image file to the article_images storage bucket
3. WHEN image upload succeeds, THE Article System SHALL retrieve the public URL for the uploaded image
4. THE Article System SHALL insert a new article record with title, content, image_url, and user_id into the database
5. WHEN article creation succeeds, THE Article System SHALL revalidate the cache and redirect the user to the homepage

### Requirement 6: Article Display

**User Story:** As a visitor, I want to view all published articles with their cover images, so that I can browse available content.

#### Acceptance Criteria

1. THE Article System SHALL fetch all articles from the database on the homepage
2. THE Article System SHALL display each article's title and cover image
3. THE Article System SHALL use the Next.js Image component for optimized image rendering
4. THE Article System SHALL render the article list as a Server Component
5. THE Article System SHALL display articles in order with newest articles first

### Requirement 7: Error Handling

**User Story:** As a user, I want clear error messages when operations fail, so that I understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN authentication fails, THE Article System SHALL return an error message indicating authentication is required
2. WHEN image upload fails, THE Article System SHALL return an error message with upload failure details
3. WHEN database insertion fails, THE Article System SHALL return an error message with database error details
4. THE Article System SHALL log errors on the server for debugging purposes
5. THE Article System SHALL prevent sensitive error details from being exposed to end users

### Requirement 8: Authentication

**User Story:** As a user, I want to be able to create articles, so that I can publish my content.
