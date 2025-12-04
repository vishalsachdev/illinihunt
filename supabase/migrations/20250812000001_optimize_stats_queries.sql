-- Migration: Optimize Platform Stats Queries
-- Purpose: Add database function for efficient unique user counting
-- Date: 2025-08-12

-- Function to get count of unique project creators (active projects only)
-- This replaces the N+1 query pattern where we fetched all projects just to count unique user_ids
CREATE OR REPLACE FUNCTION get_unique_project_creators_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unique_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id)
  INTO unique_count
  FROM projects
  WHERE status = 'active';

  RETURN COALESCE(unique_count, 0);
END;
$$;

-- Grant execute permission to authenticated users and anon
GRANT EXECUTE ON FUNCTION get_unique_project_creators_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_unique_project_creators_count() TO anon;

-- Comment on function for documentation
COMMENT ON FUNCTION get_unique_project_creators_count() IS
  'Efficiently counts the number of unique users who have created active projects. Used in platform statistics.';
