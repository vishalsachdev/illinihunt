-- Keep the original project creator on the project team.
--
-- The UI already hides the remove action for the creator, but RLS should
-- enforce the same rule so a direct API call cannot remove the creator's
-- project_members row.

drop policy if exists "Project owners can remove members" on public.project_members;

create policy "Project owners can remove members" on public.project_members
  for delete to authenticated
  using (
    public.can_manage_project(project_id, auth.uid())
    and user_id <> (
      select p.user_id
      from public.projects p
      where p.id = project_members.project_id
    )
    and (
      select count(*)
      from public.project_members remaining
      where remaining.project_id = project_members.project_id
    ) > 1
  );
