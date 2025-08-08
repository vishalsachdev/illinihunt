-- IlliniHunt Voting System Diagnosis and Fix
-- Apply this SQL directly in the Supabase Dashboard SQL Editor
-- Project ID: catzwowmxluzwbhdyhnf

-- ========================================
-- STEP 1: DIAGNOSE VOTE COUNT DISCREPANCIES
-- ========================================

-- Find projects with mismatched vote counts
SELECT 
    p.id,
    p.name,
    p.upvotes_count as stored_count,
    COUNT(v.id) as actual_votes,
    (p.upvotes_count - COUNT(v.id)) as vote_difference
FROM projects p
LEFT JOIN votes v ON p.id = v.project_id
GROUP BY p.id, p.name, p.upvotes_count
HAVING p.upvotes_count != COUNT(v.id)
ORDER BY vote_difference DESC;

-- Specifically check the mentioned projects
SELECT 
    p.id,
    p.name,
    p.upvotes_count as stored_count,
    COUNT(v.id) as actual_votes,
    (p.upvotes_count - COUNT(v.id)) as vote_difference
FROM projects p
LEFT JOIN votes v ON p.id = v.project_id
WHERE p.name IN ('AgentLab', 'Bare Basics', 'Body Craft', 'inSight', 'GameLink AI', 'StockSense App Development')
GROUP BY p.id, p.name, p.upvotes_count
ORDER BY p.name;

-- ========================================
-- STEP 2: CHECK FOR DUPLICATE RLS POLICIES
-- ========================================

-- Check all policies on the votes table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'votes'
ORDER BY policyname, cmd;

-- Look for potential duplicates
SELECT 
    policyname, 
    cmd, 
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'votes'
GROUP BY policyname, cmd
HAVING COUNT(*) > 1;

-- ========================================
-- STEP 3: CHECK TRIGGER FUNCTION STATUS
-- ========================================

-- Verify the upvotes trigger function exists
SELECT 
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'update_project_upvotes_count'
AND n.nspname = 'public';

-- Check if the trigger exists and is active
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'votes'
AND t.tgname = 'project_upvotes_count_trigger';

-- ========================================
-- STEP 4: FIX VOTE COUNT DISCREPANCIES
-- ========================================

-- Update all projects to have correct vote counts
UPDATE projects 
SET upvotes_count = vote_counts.actual_count
FROM (
    SELECT 
        p.id,
        COUNT(v.id) as actual_count
    FROM projects p
    LEFT JOIN votes v ON p.id = v.project_id
    GROUP BY p.id
) as vote_counts
WHERE projects.id = vote_counts.id
AND projects.upvotes_count != vote_counts.actual_count;

-- Verify the fix worked
SELECT 
    p.id,
    p.name,
    p.upvotes_count as stored_count,
    COUNT(v.id) as actual_votes,
    (p.upvotes_count - COUNT(v.id)) as vote_difference
FROM projects p
LEFT JOIN votes v ON p.id = v.project_id
GROUP BY p.id, p.name, p.upvotes_count
HAVING p.upvotes_count != COUNT(v.id)
ORDER BY vote_difference DESC;

-- ========================================
-- STEP 5: CLEAN UP DUPLICATE RLS POLICIES
-- ========================================

-- Note: Only run these if duplicates were found in Step 2

-- Drop potential duplicate policies (uncomment and modify as needed)
-- DROP POLICY IF EXISTS "duplicate_policy_name_here" ON votes;

-- If there are duplicate "Users can vote on projects" policies:
-- DROP POLICY IF EXISTS "Users can vote on projects" ON votes;
-- CREATE POLICY "Users can vote on projects" ON votes
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- If there are duplicate "Users can remove their votes" policies:
-- DROP POLICY IF EXISTS "Users can remove their votes" ON votes;
-- CREATE POLICY "Users can remove their votes" ON votes
--   FOR DELETE USING (auth.uid() = user_id);

-- If there are duplicate "Votes are publicly readable" policies:
-- DROP POLICY IF EXISTS "Votes are publicly readable" ON votes;
-- CREATE POLICY "Votes are publicly readable" ON votes
--   FOR SELECT USING (true);

-- ========================================
-- STEP 6: RECREATE TRIGGER IF NEEDED
-- ========================================

-- Drop and recreate the trigger function to ensure it's working properly
DROP TRIGGER IF EXISTS project_upvotes_count_trigger ON votes;
DROP FUNCTION IF EXISTS update_project_upvotes_count();

-- Recreate the function
CREATE OR REPLACE FUNCTION update_project_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET upvotes_count = upvotes_count + 1,
        updated_at = NOW()
    WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects 
    SET upvotes_count = GREATEST(upvotes_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER project_upvotes_count_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_upvotes_count();

-- ========================================
-- STEP 7: VERIFY EVERYTHING IS WORKING
-- ========================================

-- Test the trigger by checking recent vote activity
SELECT 
    v.created_at,
    v.user_id,
    v.project_id,
    p.name as project_name,
    p.upvotes_count
FROM votes v
JOIN projects p ON v.project_id = p.id
ORDER BY v.created_at DESC
LIMIT 10;

-- Final verification: ensure all vote counts match
SELECT 
    'Total projects with mismatched counts:' as check_type,
    COUNT(*) as count
FROM (
    SELECT 
        p.id
    FROM projects p
    LEFT JOIN votes v ON p.id = v.project_id
    GROUP BY p.id, p.upvotes_count
    HAVING p.upvotes_count != COUNT(v.id)
) as mismatched;

-- Show current RLS policies on votes table
SELECT 
    policyname, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'votes'
ORDER BY cmd, policyname;

-- ========================================
-- STEP 8: ADDITIONAL SAFETY CHECKS
-- ========================================

-- Ensure no negative vote counts
UPDATE projects 
SET upvotes_count = 0 
WHERE upvotes_count < 0;

-- Check for orphaned votes (votes for non-existent projects)
SELECT 
    v.id as vote_id,
    v.project_id,
    v.user_id,
    v.created_at
FROM votes v
LEFT JOIN projects p ON v.project_id = p.id
WHERE p.id IS NULL;

-- Check for duplicate votes (shouldn't happen due to unique constraint)
SELECT 
    user_id,
    project_id,
    COUNT(*) as vote_count
FROM votes
GROUP BY user_id, project_id
HAVING COUNT(*) > 1;