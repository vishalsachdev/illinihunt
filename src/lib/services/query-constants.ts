/**
 * Shared Supabase select column strings.
 * Avoids copy-pasting the same join clauses across service methods.
 */

export const PROJECT_LIST_SELECT = `
  id,
  name,
  tagline,
  description,
  image_url,
  website_url,
  github_url,
  category_id,
  user_id,
  upvotes_count,
  comments_count,
  status,
  created_at,
  updated_at,
  users (
    id,
    username,
    full_name,
    avatar_url
  ),
  categories (
    id,
    name,
    color,
    icon
  )
` as const

export const PROJECT_DETAIL_SELECT = `
  *,
  users (
    id,
    username,
    full_name,
    avatar_url,
    bio,
    github_url,
    linkedin_url
  ),
  categories (
    id,
    name,
    color,
    icon
  )
` as const

export const PROJECT_WITH_JOINS_SELECT = `
  *,
  users (
    id,
    username,
    full_name,
    avatar_url
  ),
  categories (
    id,
    name,
    color,
    icon
  )
` as const

export const COMMENT_WITH_USER_SELECT = `
  *,
  users (
    id,
    username,
    full_name,
    avatar_url
  )
` as const

export const COLLECTION_WITH_USER_SELECT = `
  *,
  users (
    id,
    username,
    full_name,
    avatar_url
  )
` as const
