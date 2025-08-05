-- Fix comment deletion RLS policy issue
-- The problem is that soft deletes (UPDATE with is_deleted=true) might be treated differently
-- This migration ensures proper RLS policies for comment updates and deletions

-- Drop and recreate the comments UPDATE policy to be more explicit
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

-- Create a more specific UPDATE policy that explicitly allows soft deletion
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure the policy allows updating is_deleted field
-- Add a more explicit policy for soft deletion if needed
CREATE POLICY "Users can soft delete own comments" ON comments
  FOR UPDATE 
  USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id AND (is_deleted = true OR is_deleted = false));

-- Drop the above duplicate policy and use a single comprehensive one
DROP POLICY IF EXISTS "Users can soft delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

-- Create a single, comprehensive UPDATE policy for comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify the DELETE policy exists (should allow hard deletes if needed)
-- The DELETE policy should already exist from the initial RLS migration

-- Add helpful comment
COMMENT ON POLICY "Users can update own comments" ON comments IS 
'Allows users to update their own comments, including soft deletion by setting is_deleted=true';