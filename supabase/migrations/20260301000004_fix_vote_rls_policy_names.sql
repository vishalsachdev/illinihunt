-- Fix: vote RLS policy names were mismatched in migration 003
-- Old permissive policies (no suspension check) still existed alongside new ones
-- Since Postgres RLS is permissive (OR logic), the old policies bypassed suspension

-- Drop incorrectly-named policies created by migration 003
DROP POLICY IF EXISTS "Users can vote" ON votes;
DROP POLICY IF EXISTS "Users can remove own vote" ON votes;

-- Drop original policies (correct names, no suspension check)
DROP POLICY IF EXISTS "Users can vote on projects" ON votes;
DROP POLICY IF EXISTS "Users can remove their votes" ON votes;

-- Re-create with correct names AND suspension check
CREATE POLICY "Users can vote on projects" ON votes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_not_suspended());

CREATE POLICY "Users can remove their votes" ON votes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND is_not_suspended());
