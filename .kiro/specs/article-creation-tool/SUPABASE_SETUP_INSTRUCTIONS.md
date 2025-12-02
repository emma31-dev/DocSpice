# Supabase Setup Instructions

Follow these steps to complete Task 3: Create database schema and storage bucket.

## Prerequisites

- Supabase project created
- Access to Supabase Dashboard
- Environment variables configured in `.env.local`

## Step-by-Step Instructions

### Task 3.1 & 3.2: Create Articles Table and Configure RLS

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to: **SQL Editor** (left sidebar)
   - Click **New Query**

2. **Execute the SQL Script**
   - Open the file: `.kiro/specs/article-creation-tool/supabase-setup.sql`
   - Copy the SQL for Tasks 3.1 and 3.2 (lines 1-60)
   - Paste into the SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Table Creation**
   - Navigate to: **Table Editor** (left sidebar)
   - You should see the `articles` table listed
   - Click on it to view the schema

4. **Verify RLS Policies**
   - In Table Editor, select the `articles` table
   - Click on **Policies** tab
   - You should see 4 policies:
     - "Allow public read access"
     - "Allow authenticated insert"
     - "Allow users to update own articles"
     - "Allow users to delete own articles"

### Task 3.3: Create Storage Bucket for Images

1. **Navigate to Storage**
   - Go to: **Storage** (left sidebar)
   - Click **New bucket**

2. **Configure Bucket Settings**
   - **Name**: `article_images`
   - **Public bucket**: Toggle **ON** (for read access)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: 
     ```
     image/jpeg
     image/png
     image/webp
     image/gif
     ```
   - Click **Create bucket**

3. **Verify Bucket Creation**
   - You should see `article_images` in the bucket list
   - The bucket should show as "Public"

### Task 3.4: Configure Storage Bucket Policies

1. **Open SQL Editor Again**
   - Navigate to: **SQL Editor** (left sidebar)
   - Click **New Query**

2. **Execute Storage Policies**
   - Open the file: `.kiro/specs/article-creation-tool/supabase-setup.sql`
   - Copy the SQL for Task 3.4 (lines 62-100)
   - Paste into the SQL Editor
   - Click **Run**

3. **Verify Storage Policies**
   - Navigate to: **Storage** > **Policies**
   - Or go to: **Storage** > `article_images` bucket > **Policies** tab
   - You should see 4 policies:
     - "Public read access"
     - "Authenticated users can upload"
     - "Users can update own images"
     - "Users can delete own images"

## Verification

Run the verification queries at the end of `supabase-setup.sql` to confirm everything is set up correctly.

### Quick Verification Checklist

- [ ] Articles table exists with correct schema
- [ ] Indexes created on `user_id` and `created_at`
- [ ] RLS enabled on articles table
- [ ] 4 RLS policies configured for articles table
- [ ] `article_images` storage bucket created
- [ ] Bucket configured as public
- [ ] File size limit set to 5MB
- [ ] MIME types restricted to images
- [ ] 4 storage policies configured for article_images bucket

## Troubleshooting

### Issue: "relation already exists"
- This means the table or policy already exists
- The script uses `IF NOT EXISTS` and `DROP POLICY IF EXISTS` for idempotency
- Safe to re-run the script

### Issue: Storage policies fail
- Ensure the `article_images` bucket is created first (Task 3.3)
- Check bucket name spelling is exact: `article_images`

### Issue: RLS policies not working
- Verify RLS is enabled: Check "RLS enabled" badge in Table Editor
- Test with authenticated user session
- Check Supabase logs for policy violations

## Next Steps

After completing this setup:
1. Mark tasks 3.1, 3.2, 3.3, and 3.4 as complete
2. Proceed to Task 4: Implement Server Action for article creation
3. Test the complete flow with authentication

## Additional Resources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
