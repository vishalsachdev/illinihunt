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
      bookmarks: {
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
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          projects_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          projects_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          projects_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      collection_projects: {
        Row: {
          id: string
          collection_id: string
          project_id: string
          added_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          project_id: string
          added_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          project_id?: string
          added_at?: string
        }
      }
    }
    Views: {
      user_bookmarks_with_projects: {
        Row: {
          id: string
          user_id: string
          bookmarked_at: string
          project_id: string
          project_name: string
          tagline: string
          image_url: string | null
          upvotes_count: number
          status: string
          project_created_at: string
          project_author: string | null
          category_name: string | null
          category_color: string | null
        }
      }
      public_collections_with_stats: {
        Row: {
          id: string
          name: string
          description: string | null
          projects_count: number
          created_at: string
          owner_username: string | null
          owner_name: string | null
          owner_avatar: string | null
        }
      }
    }
  }
}