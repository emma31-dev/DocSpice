# Implementation Plan

## Overview
This implementation plan provides step-by-step tasks for building the article creation tool. Each task builds incrementally on previous work, ensuring a functional system at each stage.

## Tasks

- [x] 1. Install Supabase dependencies and configure environment





  - Install @supabase/ssr package for Next.js integration
  - Add Supabase environment variables to .env.local.example
  - Update .env.local with actual Supabase credentials
  - _Requirements: 3.4_

- [x] 2. Create Supabase client utilities






  - [x] 2.1 Implement client-side Supabase client

    - Create src/lib/supabase/client.ts with browser client factory
    - Export createClient function using createBrowserClient from @supabase/ssr
    - _Requirements: 3.1, 3.4_
  

  - [x] 2.2 Implement server-side Supabase client

    - Create src/lib/supabase/server.ts with server client factory
    - Implement cookie handling for authentication state
    - Export async createClient function using createServerClient
    - _Requirements: 3.2, 3.4_
  

  - [x] 2.3 Implement authentication middleware

    - Create middleware.ts in project root
    - Add session refresh logic
    - Implement route protection for /create-article
    - Configure matcher to exclude static assets
    - _Requirements: 3.3, 3.5_

- [x] 3. Create database schema and storage bucket (Manual Supabase setup)






  - [x] 3.1 Create articles table

    - Execute SQL to create articles table with proper schema
    - Add indexes for user_id and created_at columns
    - _Requirements: 1.1, 1.2_
  

  - [ ] 3.2 Configure Row Level Security policies
    - Enable RLS on articles table
    - Create policy for public SELECT access
    - Create policy for authenticated INSERT with user_id check
    - Create policies for UPDATE and DELETE with ownership verification
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  
  - [ ] 3.3 Create storage bucket for images
    - Create "article_images" bucket in Supabase Storage
    - Configure bucket as public for read access
    - Set file size limit to 5MB
    - Restrict to image MIME types

    - _Requirements: 1.3_
  
  - [ ] 3.4 Configure storage bucket policies
    - Create policy for public read access
    - Create policy for authenticated upload with user folder restriction
    - Create policies for update and delete with ownership verification
    - _Requirements: 1.3_

- [x] 4. Implement Server Action for article creation



  - [x] 4.1 Create actions file with createArticle function

    - Create src/app/actions.ts with 'use server' directive
    - Define createArticle function accepting FormData
    - Implement authentication check using server Supabase client
    - Return error if user not authenticated
    - _Requirements: 4.5, 5.1_
  

  - [x] 4.2 Implement image upload logic

    - Extract image File from FormData
    - Generate unique file path using user_id and timestamp
    - Upload image to article_images bucket
    - Handle upload errors with appropriate error messages
    - _Requirements: 1.4, 5.2, 7.2_

  

  - [x] 4.3 Implement public URL retrieval and database insertion

    - Get public URL for uploaded image using getPublicUrl
    - Extract title and content from FormData
    - Insert article record with all fields including user_id
    - Handle database errors with appropriate error messages
    - _Requirements: 1.5, 5.4, 7.3_


  

  - [ ] 4.4 Implement cache revalidation and redirect
    - Call revalidatePath('/') after successful insertion
    - Redirect user to homepage using redirect('/')
    - _Requirements: 5.5_


- [-] 5. Create article creation form page


  - [x] 5.1 Implement Client Component form structure

    - Create src/app/create-article/page.tsx as Client Component
    - Add form with title input, content textarea, and image file input
    - Set required attributes on all form fields
    - Restrict file input to image types
    - _Requirements: 4.1, 4.3_
  


  - [ ] 5.2 Implement form submission and state management
    - Add form state for error messages
    - Implement form submission handler calling createArticle Server Action
    - Add loading state during form submission
    - Display submit button with loading text when pending
    - Display error messages when submission fails
    - _Requirements: 4.2, 4.4, 4.5_


  
  - [ ] 5.3 Add form styling and layout
    - Style form with Tailwind CSS classes
    - Create responsive layout for form fields
    - Add proper spacing and visual hierarchy
    - Style error messages for visibility
    - _Requirements: 4.1_

- [x] 6. Implement article display on homepage



  - [x] 6.1 Update homepage to fetch and display articles

    - Modify src/app/page.tsx to be async Server Component
    - Create server Supabase client
    - Fetch all articles ordered by created_at descending
    - Handle query errors with error display
    - _Requirements: 6.1, 6.4_
  
  - [x] 6.2 Render article list with images

    - Map over articles array to render each article
    - Display article title and content preview
    - Use Next.js Image component for cover images
    - Set appropriate width, height, and alt attributes
    - _Requirements: 6.2, 6.3, 6.5_
  
  - [x] 6.3 Style article display

    - Create responsive grid layout for articles
    - Style article cards with Tailwind CSS
    - Add hover effects and transitions
    - Ensure images are properly sized and responsive
    - _Requirements: 6.2_

- [x] 7. Add navigation and user experience improvements




  - [x] 7.1 Add navigation link to create article page

    - Update layout or homepage with link to /create-article
    - Style navigation appropriately
    - _Requirements: 4.1_
  
  - [x] 7.2 Add success feedback after article creation

    - Show success message or toast after redirect
    - Highlight newly created article on homepage
    - _Requirements: 5.5_

- [ ]* 8. Create TypeScript type definitions
  - Create src/types/article.ts with Article interface
  - Define FormData and ActionResponse types
  - Export types for use across application
  - _Requirements: 1.1_

- [ ]* 9. Add comprehensive error logging
  - Add server-side error logging in Server Action
  - Log authentication failures
  - Log upload failures with details
  - Log database errors
  - Ensure sensitive data is not exposed in client errors
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 10. Implement form validation enhancements
  - Add client-side file size validation (5MB limit)
  - Add client-side file type validation
  - Display validation errors before submission
  - Add content length validation
  - _Requirements: 4.3_
