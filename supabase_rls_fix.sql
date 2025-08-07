-- Manual SQL fix for comment deletion RLS policy issue
-- Apply this directly in the Supabase Dashboard SQL Editor

-- First, check current comment policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'comments';

-- Drop the existing UPDATE policy that might be causing issues
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

-- Create a new, more permissive UPDATE policy for comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- The key difference: removed the WITH CHECK clause that might be causing the RLS violation
-- This allows users to update their own comments without additional restrictions on the result

-- Verify the policy was created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'comments' AND policyname = 'Users can update own comments';

-- Test query to verify the fix works (replace the UUIDs with actual values when testing)
-- UPDATE comments SET is_deleted = true WHERE id = 'your-comment-id' AND user_id = auth.uid();