/** Embedded user info returned by Supabase joins */
export interface UserInfo {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

/** Embedded category info returned by Supabase joins */
export interface CategoryInfo {
  id: string
  name: string
  color: string | null
  icon: string | null
}
