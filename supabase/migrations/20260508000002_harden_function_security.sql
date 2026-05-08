-- Hardens public functions per Supabase Security Advisor (2026-05-08).
--
-- Two changes for each function:
--   (1) Pin search_path to `public, pg_catalog` to satisfy the
--       function_search_path_mutable lint and prevent search_path
--       shadowing of public objects by malicious callers.
--   (2) Tighten EXECUTE grants. Postgres grants EXECUTE to PUBLIC by
--       default, so we revoke from PUBLIC explicitly (in addition to
--       anon/authenticated) and re-grant only to roles that actually
--       need to call the function.
--
-- Wrapped in a PL/pgSQL block that checks `to_regprocedure(...)` so the
-- migration is safe to apply against environments where some functions
-- aren't present (e.g. fresh `supabase db reset` from repo migrations
-- alone — several of these functions were created via dashboard and
-- aren't in the migration history yet).

do $$
declare
  -- Functions that anon AND authenticated must keep calling.
  -- (RLS-policy helpers; CHECK helper; public homepage stats RPC.)
  keep_public_grant text[] := array[
    'public.is_admin()',
    'public.is_not_suspended()',
    'public.is_project_member(uuid, uuid)',
    'public.can_manage_project(uuid, uuid)',
    'public.is_valid_illinois_email(text)',
    'public.get_unique_project_creators_count()'
  ];

  -- Authenticated-only RPCs (admin actions guarded server-side by
  -- is_admin(); invitation/report actions require an auth session).
  authenticated_only text[] := array[
    'public.admin_delete_comment(uuid)',
    'public.admin_delete_project(uuid)',
    'public.admin_get_comments(text, integer, integer)',
    'public.admin_get_projects(text, text, integer, integer)',
    'public.admin_get_reports(text, integer, integer)',
    'public.admin_get_stats()',
    'public.admin_get_users(text, integer, integer)',
    'public.admin_resolve_report(uuid, text)',
    'public.admin_suspend_user(uuid)',
    'public.admin_unsuspend_user(uuid)',
    'public.admin_update_project_status(uuid, text)',
    'public.accept_project_invitation(uuid)',
    'public.decline_project_invitation(uuid)',
    'public.revoke_project_invitation(uuid)',
    'public.report_content(text, uuid, text, text)'
  ];

  -- Trigger-only / internal helpers. No role needs RPC access; trigger
  -- execution does not consult these grants.
  trigger_only text[] := array[
    'public.add_project_creator_member()',
    'public.update_project_vote_count()',
    'public.sync_vote_counts()',
    'public.update_collection_projects_count()',
    'public.update_comment_likes_count()',
    'public.update_project_comments_count()',
    'public.update_project_upvotes_count()',
    -- _robust variant exists in repo migration 20250814154600 but not in
    -- live prod (drift — flagged separately). Guarded by to_regprocedure
    -- below so this list works in both environments.
    'public.update_project_upvotes_count_robust()',
    'public.update_updated_at_column()'
  ];

  fn text;
begin
  -- (1) Pin search_path on every function in the union of the three lists.
  foreach fn in array (keep_public_grant || authenticated_only || trigger_only) loop
    if to_regprocedure(fn) is not null then
      execute format('alter function %s set search_path = public, pg_catalog', fn);
    else
      raise notice 'skipping search_path: % does not exist', fn;
    end if;
  end loop;

  -- (2a) Helper/stats functions: keep callable by anon and authenticated
  -- but remove the implicit PUBLIC grant so future role additions don't
  -- inherit access automatically.
  foreach fn in array keep_public_grant loop
    if to_regprocedure(fn) is not null then
      execute format('revoke execute on function %s from public', fn);
      execute format('grant execute on function %s to anon, authenticated', fn);
    end if;
  end loop;

  -- (2b) Authenticated-only RPCs: revoke from public + anon, grant to authenticated.
  foreach fn in array authenticated_only loop
    if to_regprocedure(fn) is not null then
      execute format('revoke execute on function %s from public, anon', fn);
      execute format('grant execute on function %s to authenticated', fn);
    end if;
  end loop;

  -- (2c) Trigger-only / internal: revoke from every client role.
  foreach fn in array trigger_only loop
    if to_regprocedure(fn) is not null then
      execute format('revoke execute on function %s from public, anon, authenticated', fn);
    end if;
  end loop;
end$$;
