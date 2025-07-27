export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          github_url: string | null
          linkedin_url: string | null
          website_url: string | null
          year_of_study: string | null
          department: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          year_of_study?: string | null
          department?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          year_of_study?: string | null
          department?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string
          is_active?: boolean
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          tagline: string
          description: string
          image_url: string | null
          website_url: string | null
          github_url: string | null
          category_id: string | null
          user_id: string
          upvotes_count: number
          comments_count: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          tagline: string
          description: string
          image_url?: string | null
          website_url?: string | null
          github_url?: string | null
          category_id?: string | null
          user_id: string
          upvotes_count?: number
          comments_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tagline?: string
          description?: string
          image_url?: string | null
          website_url?: string | null
          github_url?: string | null
          category_id?: string | null
          user_id?: string
          upvotes_count?: number
          comments_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          content: string
          user_id: string
          project_id: string
          parent_id: string | null
          thread_depth: number
          likes_count: number
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          user_id: string
          project_id: string
          parent_id?: string | null
          thread_depth?: number
          likes_count?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          user_id?: string
          project_id?: string
          parent_id?: string | null
          thread_depth?: number
          likes_count?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          user_id: string
          comment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          comment_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          comment_id?: string
          created_at?: string
        }
      }
    }
  }
}