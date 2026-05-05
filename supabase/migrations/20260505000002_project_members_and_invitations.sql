-- Add shared project ownership through project members and in-app invitations.

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner')),
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.project_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  invitee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, invitee_id, status)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_project_invitations_one_pending
  ON public.project_invitations(project_id, invitee_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON public.project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_invitee_id ON public.project_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_status ON public.project_invitations(status);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_manage_project(p_project_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_not_suspended()
    AND EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = p_project_id
        AND pm.user_id = p_user_id
        AND pm.role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_project_member(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_project(UUID, UUID) TO authenticated;

INSERT INTO public.project_members (project_id, user_id, role, created_at)
SELECT id, user_id, 'owner', COALESCE(created_at, NOW())
FROM public.projects
ON CONFLICT (project_id, user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.add_project_creator_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS add_project_creator_member_trigger ON public.projects;
CREATE TRIGGER add_project_creator_member_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.add_project_creator_member();

DROP POLICY IF EXISTS "Projects are publicly readable" ON public.projects;
CREATE POLICY "Projects are publicly readable" ON public.projects
  FOR SELECT USING (status != 'draft' OR public.is_project_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Project members can update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.is_project_member(id, auth.uid()) AND public.is_not_suspended())
  WITH CHECK (public.is_project_member(id, auth.uid()) AND public.is_not_suspended());

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Original creators can delete projects" ON public.projects
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.is_not_suspended());

CREATE POLICY "Project members are publicly readable" ON public.project_members
  FOR SELECT USING (true);

CREATE POLICY "Project owners can add members" ON public.project_members
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_project(project_id, auth.uid()));

CREATE POLICY "Project owners can remove members" ON public.project_members
  FOR DELETE TO authenticated
  USING (
    public.can_manage_project(project_id, auth.uid())
    AND (
      SELECT COUNT(*)
      FROM public.project_members remaining
      WHERE remaining.project_id = project_members.project_id
    ) > 1
  );

CREATE POLICY "Users can view related project invitations" ON public.project_invitations
  FOR SELECT TO authenticated
  USING (invitee_id = auth.uid() OR public.can_manage_project(project_id, auth.uid()));

CREATE POLICY "Project owners can create invitations" ON public.project_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    inviter_id = auth.uid()
    AND invitee_id <> auth.uid()
    AND status = 'pending'
    AND public.can_manage_project(project_id, auth.uid())
  );

CREATE OR REPLACE FUNCTION public.accept_project_invitation(p_invitation_id UUID)
RETURNS JSON AS $$
DECLARE
  v_invitation public.project_invitations%ROWTYPE;
BEGIN
  SELECT *
  INTO v_invitation
  FROM public.project_invitations
  WHERE id = p_invitation_id
    AND invitee_id = auth.uid()
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF NOT public.is_not_suspended() THEN
    RAISE EXCEPTION 'Suspended users cannot accept project invitations';
  END IF;

  INSERT INTO public.project_members (project_id, user_id, role, invited_by)
  VALUES (v_invitation.project_id, v_invitation.invitee_id, 'owner', v_invitation.inviter_id)
  ON CONFLICT (project_id, user_id) DO NOTHING;

  UPDATE public.project_invitations
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_invitation_id;

  RETURN json_build_object('project_id', v_invitation.project_id, 'status', 'accepted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decline_project_invitation(p_invitation_id UUID)
RETURNS JSON AS $$
DECLARE
  v_project_id UUID;
BEGIN
  UPDATE public.project_invitations
  SET status = 'declined', responded_at = NOW()
  WHERE id = p_invitation_id
    AND invitee_id = auth.uid()
    AND status = 'pending'
  RETURNING project_id INTO v_project_id;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  RETURN json_build_object('project_id', v_project_id, 'status', 'declined');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.revoke_project_invitation(p_invitation_id UUID)
RETURNS JSON AS $$
DECLARE
  v_project_id UUID;
BEGIN
  UPDATE public.project_invitations
  SET status = 'revoked', responded_at = NOW()
  WHERE id = p_invitation_id
    AND status = 'pending'
    AND public.can_manage_project(project_id, auth.uid())
  RETURNING project_id INTO v_project_id;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  RETURN json_build_object('project_id', v_project_id, 'status', 'revoked');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.accept_project_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_project_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_project_invitation(UUID) TO authenticated;
