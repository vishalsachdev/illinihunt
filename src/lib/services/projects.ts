import { supabase } from '../supabase'
import type { Database } from '@/types/database'
import { requireAuth } from './auth-helpers'
import { PROJECT_LIST_SELECT, PROJECT_DETAIL_SELECT } from './query-constants'

type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

type UserSearchResult = Pick<
  Database['public']['Tables']['users']['Row'],
  'id' | 'email' | 'username' | 'full_name' | 'avatar_url'
>

type ProjectMember = Database['public']['Tables']['project_members']['Row'] & {
  users: Pick<Database['public']['Tables']['users']['Row'], 'id' | 'username' | 'full_name' | 'avatar_url'> | null
}

type ProjectInvitation = Database['public']['Tables']['project_invitations']['Row'] & {
  users: Pick<Database['public']['Tables']['users']['Row'], 'id' | 'username' | 'full_name' | 'avatar_url' | 'email'> | null
}

type ProjectWithCategory = Database['public']['Tables']['projects']['Row'] & {
  categories: {
    id: string
    name: string
    color: string | null
    icon: string | null
  } | null
}

export class ProjectsService {
  static async getProjects(options?: {
    category?: string
    search?: string
    sortBy?: 'recent' | 'popular' | 'featured' | 'trending'
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('projects')
      .select(PROJECT_LIST_SELECT)
      .eq('status', 'active')

    if (options?.category) {
      query = query.eq('category_id', options.category)
    }

    if (options?.search) {
      // Sanitize search input: escape PostgREST special characters to prevent filter injection
      const sanitized = options.search.replace(/[%_\\,()]/g, (c) => `\\${c}`)
      query = query.or(`name.ilike.%${sanitized}%,tagline.ilike.%${sanitized}%`)
    }

    switch (options?.sortBy) {
      case 'popular':
        query = query.order('upvotes_count', { ascending: false })
        break
      case 'featured':
        query = query.eq('status', 'featured').order('created_at', { ascending: false })
        break
      case 'trending':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  }

  static async getProject(id: string) {
    return supabase
      .from('projects')
      .select(PROJECT_DETAIL_SELECT)
      .eq('id', id)
      .single()
  }

  static async createProject(project: ProjectInsert) {
    return supabase
      .from('projects')
      .insert(project)
      .select(PROJECT_LIST_SELECT)
      .single()
  }

  static async updateProject(id: string, updates: ProjectUpdate) {
    const safeUpdates = { ...updates }
    delete safeUpdates.user_id

    return supabase
      .from('projects')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single()
  }

  static async deleteProject(id: string) {
    const user = await requireAuth('delete projects')

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', id)
      .single()

    if (fetchError) {
      return { data: null, error: { message: 'Project not found', code: 'NOT_FOUND' } }
    }

    if (project.user_id !== user.id) {
      return { data: null, error: { message: 'You can only delete your own projects', code: 'UNAUTHORIZED' } }
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { data: null, error }
    }

    return { data: project, error: null }
  }

  static async voteProject(projectId: string) {
    const user = await requireAuth('vote')
    return supabase
      .from('votes')
      .insert({ project_id: projectId, user_id: user.id })
  }

  static async unvoteProject(projectId: string) {
    const user = await requireAuth('vote')
    return supabase
      .from('votes')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)
  }

  static async hasUserVoted(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && (error.code === 'PGRST202' || error.code === '406' || error.message.includes('406'))) {
        return false
      }

      if (error) return false
      return !!data
    } catch {
      return false
    }
  }

  static async getUserProfile(userId: string) {
    return supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
  }

  static async getUserProjects(userId: string) {
    const ownedResult = await supabase
      .from('projects')
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    const memberResult = await supabase
      .from('project_members')
      .select(`
        role,
        projects (
          *,
          categories (
            id,
            name,
            color,
            icon
          )
        )
      `)
      .eq('user_id', userId)

    if (ownedResult.error) {
      return ownedResult
    }

    if (memberResult.error) {
      return { data: ownedResult.data, error: null }
    }

    const projectsById = new Map<string, ProjectWithCategory & {
      membership_role?: string | null
      is_creator?: boolean
    }>()

    for (const project of ownedResult.data || []) {
      projectsById.set(project.id, {
        ...project,
        membership_role: 'owner',
        is_creator: true
      })
    }

    for (const row of memberResult.data || []) {
      const project = row.projects as unknown as ProjectWithCategory | null
      if (!project || project.status !== 'active') continue

      projectsById.set(project.id, {
        ...project,
        membership_role: row.role,
        is_creator: project.user_id === userId
      })
    }

    const data = Array.from(projectsById.values()).sort((a, b) => (
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    ))

    return { data, error: null }
  }

  static async canEditProject(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('is_project_member', {
      p_project_id: projectId,
      p_user_id: user.id
    })

    if (error) return false
    return !!data
  }

  static async canManageProject(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('can_manage_project', {
      p_project_id: projectId,
      p_user_id: user.id
    })

    if (error) return false
    return !!data
  }

  static async searchUsersForInvite(query: string) {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      return { data: [] as UserSearchResult[], error: null }
    }

    const sanitized = trimmed.replace(/[%_\\,()]/g, (c) => `\\${c}`)

    return supabase
      .from('users')
      .select('id, email, username, full_name, avatar_url')
      .is('suspended_at', null)
      .or(`email.ilike.%${sanitized}%,username.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`)
      .limit(8)
  }

  static async getProjectMembers(projectId: string) {
    // project_members has two FKs to users (user_id and invited_by); pick the
    // member relationship explicitly so PostgREST doesn't 300 on ambiguity.
    return supabase
      .from('project_members')
      .select(`
        *,
        users!project_members_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }) as unknown as Promise<{ data: ProjectMember[] | null; error: { message: string } | null }>
  }

  static async getProjectInvitations(projectId: string) {
    return supabase
      .from('project_invitations')
      .select(`
        *,
        users!project_invitations_invitee_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: ProjectInvitation[] | null; error: { message: string } | null }>
  }

  static async inviteProjectMember(projectId: string, inviteeId: string) {
    const user = await requireAuth('invite project members')

    if (user.id === inviteeId) {
      return { data: null, error: { message: 'You are already on this project', code: 'SELF_INVITE' } }
    }

    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', inviteeId)
      .maybeSingle()

    if (existingMember) {
      return { data: null, error: { message: 'That person is already on this project', code: 'ALREADY_MEMBER' } }
    }

    return supabase
      .from('project_invitations')
      .insert({
        project_id: projectId,
        inviter_id: user.id,
        invitee_id: inviteeId,
        status: 'pending'
      })
      .select()
      .single()
  }

  static async revokeProjectInvitation(invitationId: string) {
    return supabase.rpc('revoke_project_invitation', {
      p_invitation_id: invitationId
    })
  }

  static async removeProjectMember(projectId: string, memberUserId: string) {
    return supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', memberUserId)
  }

  static async getPendingInvitationsForCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: [], error: null }
    }

    return supabase
      .from('project_invitations')
      .select(`
        *,
        projects (
          id,
          name,
          tagline,
          image_url
        ),
        users!project_invitations_inviter_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
  }

  static async acceptProjectInvitation(invitationId: string) {
    return supabase.rpc('accept_project_invitation', {
      p_invitation_id: invitationId
    })
  }

  static async declineProjectInvitation(invitationId: string) {
    return supabase.rpc('decline_project_invitation', {
      p_invitation_id: invitationId
    })
  }

  static async updateUserProfile(userId: string, updates: {
    username?: string | null
    full_name?: string | null
    bio?: string | null
    github_url?: string | null
    linkedin_url?: string | null
    website_url?: string | null
    year_of_study?: string | null
    department?: string | null
  }) {
    return supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
  }
}
