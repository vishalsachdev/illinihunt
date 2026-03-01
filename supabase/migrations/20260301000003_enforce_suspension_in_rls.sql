-- Migration: Enforce suspension in RLS write policies
-- Suspended users (suspended_at IS NOT NULL) cannot create/update projects, comments, or votes

-- Helper function: check if current user is NOT suspended
CREATE OR REPLACE FUNCTION is_not_suspended()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND suspended_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_not_suspended() TO authenticated;

-- Projects: block suspended users from inserting/updating
DROP POLICY IF EXISTS "Users can create projects" ON projects;
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_not_suspended());

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND is_not_suspended());

-- Comments: block suspended users from inserting
DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_not_suspended());

-- Comments: block suspended users from updating (edit/soft-delete own comments)
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND is_not_suspended());

-- Votes: block suspended users from voting
DROP POLICY IF EXISTS "Users can vote on projects" ON votes;
CREATE POLICY "Users can vote on projects" ON votes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_not_suspended());

DROP POLICY IF EXISTS "Users can remove their votes" ON votes;
CREATE POLICY "Users can remove their votes" ON votes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND is_not_suspended());

-- Reports: block suspended users from reporting
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND is_not_suspended());
