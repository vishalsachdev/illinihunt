import type { UserInfo } from './project'

/** Comment data shape returned by Supabase with user join */
export interface CommentData {
  id: string
  content: string
  created_at: string | null
  updated_at: string | null
  parent_id: string | null
  is_deleted: boolean | null
  thread_depth: number | null
  likes_count: number | null
  users: UserInfo | null
}
