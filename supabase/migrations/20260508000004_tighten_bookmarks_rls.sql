-- Privacy: bookmarks SELECT was `qual=true` meaning any client (anon
-- included) could enumerate every user's bookmarks via /rest/v1/bookmarks.
-- The app only ever reads bookmarks scoped to the current user, so
-- restrict SELECT to own rows. Also dedupe two pairs of identical
-- INSERT/DELETE policies left over from earlier migrations.

drop policy if exists "Users can view all bookmarks" on public.bookmarks;
drop policy if exists "Users can insert their own bookmarks" on public.bookmarks;
drop policy if exists "Users can delete their own bookmarks" on public.bookmarks;

create policy "Users can view own bookmarks"
  on public.bookmarks
  for select
  to authenticated
  using (auth.uid() = user_id);
