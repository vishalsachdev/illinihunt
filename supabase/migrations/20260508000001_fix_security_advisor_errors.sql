-- Fix the 3 ERROR-level findings from Supabase Security Advisor (2026-05-08).
--
-- 1) public.comments has policies but RLS is disabled — policies are inert
--    and the table is effectively wide open. Enable RLS so existing policies
--    (publicly readable, own-row insert/update/delete, suspension gate) take effect.
--
-- 2) public.user_bookmarks_with_projects and public.public_collections_with_stats
--    are SECURITY DEFINER views, which bypass the caller's RLS. All underlying
--    tables (users, bookmarks, collections, projects, categories) already have
--    sufficient SELECT policies for the rows these views expose, so flipping
--    them to security_invoker is safe and removes the privilege bypass.

alter table public.comments enable row level security;

alter view public.user_bookmarks_with_projects set (security_invoker = true);
alter view public.public_collections_with_stats set (security_invoker = true);
