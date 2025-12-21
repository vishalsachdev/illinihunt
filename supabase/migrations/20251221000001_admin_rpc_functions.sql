-- Migration: Add admin support for project management
-- This creates RPC functions that run with elevated privileges (SECURITY DEFINER)
-- to allow admins to manage projects they don't own.

-- Create admin check function
-- Checks if the current authenticated user's email is in the admin list
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the email from the JWT claims
  user_email := LOWER(auth.jwt()->>'email');

  -- Check against hardcoded admin emails
  -- To add new admins, update this list and redeploy
  RETURN user_email = ANY(ARRAY[
    'vishal@illinois.edu'
  ]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- RPC function: Admin update project status
-- Allows admins to change project status (active, featured, archived)
CREATE OR REPLACE FUNCTION admin_update_project_status(
  project_id UUID,
  new_status TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Validate status
  IF new_status NOT IN ('active', 'featured', 'archived', 'draft') THEN
    RAISE EXCEPTION 'Invalid status: must be active, featured, archived, or draft';
  END IF;

  -- Update the project
  UPDATE projects
  SET status = new_status, updated_at = NOW()
  WHERE id = project_id;

  -- Return updated project with related data
  SELECT json_build_object(
    'id', p.id,
    'name', p.name,
    'tagline', p.tagline,
    'description', p.description,
    'image_url', p.image_url,
    'website_url', p.website_url,
    'github_url', p.github_url,
    'upvotes_count', p.upvotes_count,
    'comments_count', p.comments_count,
    'status', p.status,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'users', json_build_object(
      'id', u.id,
      'username', u.username,
      'full_name', u.full_name,
      'avatar_url', u.avatar_url,
      'email', u.email
    ),
    'categories', CASE WHEN c.id IS NOT NULL THEN json_build_object(
      'id', c.id,
      'name', c.name,
      'color', c.color,
      'icon', c.icon
    ) ELSE NULL END
  ) INTO result
  FROM projects p
  LEFT JOIN users u ON p.user_id = u.id
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE p.id = project_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_update_project_status(UUID, TEXT) TO authenticated;

-- RPC function: Admin delete project
-- Allows admins to delete any project and its related data
CREATE OR REPLACE FUNCTION admin_delete_project(
  project_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Delete related records first (respects foreign key constraints)
  DELETE FROM votes WHERE project_id = admin_delete_project.project_id;
  DELETE FROM comments WHERE project_id = admin_delete_project.project_id;
  DELETE FROM bookmarks WHERE project_id = admin_delete_project.project_id;
  DELETE FROM collection_projects WHERE project_id = admin_delete_project.project_id;

  -- Delete the project
  DELETE FROM projects WHERE id = admin_delete_project.project_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_delete_project(UUID) TO authenticated;

-- RPC function: Admin get all projects
-- Returns all projects regardless of status (for admin dashboard)
CREATE OR REPLACE FUNCTION admin_get_projects(
  filter_status TEXT DEFAULT NULL,
  search_query TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 50,
  result_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_agg(project_data) INTO result
  FROM (
    SELECT json_build_object(
      'id', p.id,
      'name', p.name,
      'tagline', p.tagline,
      'description', p.description,
      'image_url', p.image_url,
      'website_url', p.website_url,
      'github_url', p.github_url,
      'upvotes_count', p.upvotes_count,
      'comments_count', p.comments_count,
      'status', p.status,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'users', json_build_object(
        'id', u.id,
        'username', u.username,
        'full_name', u.full_name,
        'avatar_url', u.avatar_url,
        'email', u.email
      ),
      'categories', CASE WHEN c.id IS NOT NULL THEN json_build_object(
        'id', c.id,
        'name', c.name,
        'color', c.color,
        'icon', c.icon
      ) ELSE NULL END
    ) AS project_data
    FROM projects p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE (filter_status IS NULL OR p.status = filter_status)
      AND (search_query IS NULL OR p.name ILIKE '%' || search_query || '%' OR p.tagline ILIKE '%' || search_query || '%')
    ORDER BY p.created_at DESC
    LIMIT result_limit
    OFFSET result_offset
  ) subquery;

  -- Return empty array if no results
  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_get_projects(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- RPC function: Admin get platform stats
-- Returns platform-wide statistics for admin dashboard
CREATE OR REPLACE FUNCTION admin_get_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'totalProjects', (SELECT COUNT(*) FROM projects),
    'activeProjects', (SELECT COUNT(*) FROM projects WHERE status = 'active'),
    'featuredProjects', (SELECT COUNT(*) FROM projects WHERE status = 'featured'),
    'archivedProjects', (SELECT COUNT(*) FROM projects WHERE status = 'archived'),
    'totalUsers', (SELECT COUNT(*) FROM users),
    'totalUpvotes', (SELECT COUNT(*) FROM votes),
    'totalComments', (SELECT COUNT(*) FROM comments WHERE is_deleted = false)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_get_stats() TO authenticated;

-- Add comment explaining the admin system
COMMENT ON FUNCTION is_admin() IS 'Checks if the current authenticated user is an admin based on email. Update the hardcoded email list to add/remove admins.';
COMMENT ON FUNCTION admin_update_project_status(UUID, TEXT) IS 'Admin-only function to update project status (active, featured, archived, draft).';
COMMENT ON FUNCTION admin_delete_project(UUID) IS 'Admin-only function to delete a project and all related data.';
COMMENT ON FUNCTION admin_get_projects(TEXT, TEXT, INTEGER, INTEGER) IS 'Admin-only function to get all projects regardless of status.';
COMMENT ON FUNCTION admin_get_stats() IS 'Admin-only function to get platform-wide statistics.';
