-- Tighten storage policy on `project-images` bucket per Supabase
-- Security Advisor (public_bucket_allows_listing).
--
-- The existing SELECT policy `bucket_id = 'project-images'` lets clients
-- enumerate every object via storage.from(...).list(). The app does not
-- use list() or download() — only upload() and getPublicUrl(), and public
-- bucket CDN access (/storage/v1/object/public/...) does not consult
-- storage.objects RLS at all. Dropping the policy removes the listing
-- capability without affecting public image rendering.

drop policy if exists "Project images are publicly accessible" on storage.objects;
