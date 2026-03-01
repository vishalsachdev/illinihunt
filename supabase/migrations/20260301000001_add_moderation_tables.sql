-- Migration: Add moderation tables for content reporting and user suspension
-- Design doc: docs/plans/2026-03-01-admin-moderation-design.md

-- 1. Add suspended_at to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('project', 'comment')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'broken_link', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reporter_id, target_type, target_id)
);

-- 3. Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_users_suspended ON users(suspended_at) WHERE suspended_at IS NOT NULL;

-- 4. RLS policies for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can see their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- Admins can see all reports (via RPC, but also direct access)
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT TO authenticated
  USING (is_admin());

-- Admins can update reports (resolve/dismiss)
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE TO authenticated
  USING (is_admin());
