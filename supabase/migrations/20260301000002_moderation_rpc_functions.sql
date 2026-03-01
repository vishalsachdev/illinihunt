-- Migration: Add RPC functions for moderation tools
-- All admin functions check is_admin() before executing

-- 1. report_content — any authenticated user can report
CREATE OR REPLACE FUNCTION report_content(
  p_target_type TEXT,
  p_target_id UUID,
  p_reason TEXT,
  p_details TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Validate target_type
  IF p_target_type NOT IN ('project', 'comment') THEN
    RAISE EXCEPTION 'Invalid target_type: must be project or comment';
  END IF;

  -- Validate reason
  IF p_reason NOT IN ('spam', 'inappropriate', 'broken_link', 'other') THEN
    RAISE EXCEPTION 'Invalid reason: must be spam, inappropriate, broken_link, or other';
  END IF;

  -- Check the target actually exists
  IF p_target_type = 'project' THEN
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_target_id) THEN
      RAISE EXCEPTION 'Project not found';
    END IF;
  ELSIF p_target_type = 'comment' THEN
    IF NOT EXISTS (SELECT 1 FROM comments WHERE id = p_target_id AND is_deleted = false) THEN
      RAISE EXCEPTION 'Comment not found';
    END IF;
  END IF;

  INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
  VALUES (auth.uid(), p_target_type, p_target_id, p_reason, p_details)
  ON CONFLICT (reporter_id, target_type, target_id) DO NOTHING
  RETURNING json_build_object(
    'id', id,
    'target_type', target_type,
    'target_id', target_id,
    'reason', reason,
    'status', status,
    'created_at', created_at
  ) INTO result;

  IF result IS NULL THEN
    RAISE EXCEPTION 'You have already reported this content';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION report_content(TEXT, UUID, TEXT, TEXT) TO authenticated;

-- 2. admin_get_reports — admin only
CREATE OR REPLACE FUNCTION admin_get_reports(
  filter_status TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_agg(r) INTO result FROM (
    SELECT
      rep.id,
      rep.target_type,
      rep.target_id,
      rep.reason,
      rep.details,
      rep.status,
      rep.created_at,
      rep.resolved_at,
      json_build_object(
        'id', reporter.id,
        'username', reporter.username,
        'full_name', reporter.full_name,
        'email', reporter.email
      ) AS reporter,
      json_build_object(
        'id', resolver.id,
        'username', resolver.username,
        'full_name', resolver.full_name
      ) AS resolved_by_user,
      CASE
        WHEN rep.target_type = 'project' THEN (
          SELECT json_build_object('id', p.id, 'name', p.name, 'tagline', p.tagline, 'status', p.status)
          FROM projects p WHERE p.id = rep.target_id
        )
        WHEN rep.target_type = 'comment' THEN (
          SELECT json_build_object('id', c.id, 'content', c.content, 'project_id', c.project_id, 'is_deleted', c.is_deleted)
          FROM comments c WHERE c.id = rep.target_id
        )
      END AS target
    FROM reports rep
    JOIN users reporter ON reporter.id = rep.reporter_id
    LEFT JOIN users resolver ON resolver.id = rep.resolved_by
    WHERE (filter_status IS NULL OR rep.status = filter_status)
    ORDER BY
      CASE rep.status WHEN 'pending' THEN 0 ELSE 1 END,
      rep.created_at DESC
    LIMIT result_limit OFFSET result_offset
  ) r;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_reports(TEXT, INT, INT) TO authenticated;

-- 3. admin_resolve_report — admin only
CREATE OR REPLACE FUNCTION admin_resolve_report(
  p_report_id UUID,
  p_resolution TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  IF p_resolution NOT IN ('resolved', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid resolution: must be resolved or dismissed';
  END IF;

  UPDATE reports
  SET status = p_resolution, resolved_by = auth.uid(), resolved_at = NOW()
  WHERE id = p_report_id AND status = 'pending'
  RETURNING json_build_object(
    'id', id,
    'status', status,
    'resolved_at', resolved_at
  ) INTO result;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Report not found or already resolved';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_resolve_report(UUID, TEXT) TO authenticated;

-- 4. admin_get_comments — admin only, all comments with user + project info
CREATE OR REPLACE FUNCTION admin_get_comments(
  search_query TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_agg(r) INTO result FROM (
    SELECT
      c.id,
      c.content,
      c.is_deleted,
      c.created_at,
      c.project_id,
      json_build_object('id', u.id, 'username', u.username, 'full_name', u.full_name, 'email', u.email) AS users,
      json_build_object('id', p.id, 'name', p.name) AS project
    FROM comments c
    JOIN users u ON u.id = c.user_id
    JOIN projects p ON p.id = c.project_id
    WHERE (search_query IS NULL OR c.content ILIKE '%' || search_query || '%')
    ORDER BY c.created_at DESC
    LIMIT result_limit OFFSET result_offset
  ) r;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_comments(TEXT, INT, INT) TO authenticated;

-- 5. admin_delete_comment — admin only, soft delete
CREATE OR REPLACE FUNCTION admin_delete_comment(
  p_comment_id UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  UPDATE comments
  SET is_deleted = true, updated_at = NOW()
  WHERE id = p_comment_id AND (is_deleted = false OR is_deleted IS NULL)
  RETURNING json_build_object('id', id, 'is_deleted', is_deleted) INTO result;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Comment not found or already deleted';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_delete_comment(UUID) TO authenticated;

-- 6. admin_get_users — admin only
CREATE OR REPLACE FUNCTION admin_get_users(
  search_query TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_agg(r) INTO result FROM (
    SELECT
      u.id,
      u.email,
      u.username,
      u.full_name,
      u.avatar_url,
      u.created_at,
      u.suspended_at,
      (SELECT COUNT(*) FROM projects WHERE user_id = u.id)::INT AS project_count,
      (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND (is_deleted = false OR is_deleted IS NULL))::INT AS comment_count
    FROM users u
    WHERE (search_query IS NULL OR u.email ILIKE '%' || search_query || '%' OR u.full_name ILIKE '%' || search_query || '%' OR u.username ILIKE '%' || search_query || '%')
    ORDER BY u.created_at DESC
    LIMIT result_limit OFFSET result_offset
  ) r;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_users(TEXT, INT, INT) TO authenticated;

-- 7. admin_suspend_user — admin only
CREATE OR REPLACE FUNCTION admin_suspend_user(
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Prevent self-suspension
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot suspend yourself';
  END IF;

  UPDATE users SET suspended_at = NOW() WHERE id = p_user_id AND suspended_at IS NULL;

  RETURN json_build_object('id', p_user_id, 'suspended', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_suspend_user(UUID) TO authenticated;

-- 8. admin_unsuspend_user — admin only
CREATE OR REPLACE FUNCTION admin_unsuspend_user(
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  UPDATE users SET suspended_at = NULL WHERE id = p_user_id AND suspended_at IS NOT NULL;

  RETURN json_build_object('id', p_user_id, 'suspended', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_unsuspend_user(UUID) TO authenticated;
