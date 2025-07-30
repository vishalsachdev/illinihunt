# Technical Specifications - IlliniHunt V2

## Technology Stack Deep Dive

### Frontend Architecture

#### React + TypeScript Setup
```typescript
// Project structure for optimal development
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── auth/               # Authentication components
│   │   ├── LoginButton.tsx
│   │   ├── AuthGuard.tsx
│   │   └── UserMenu.tsx
│   ├── project/            # Project-related components
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── ProjectDetail.tsx
│   │   └── VoteButton.tsx
│   ├── comment/            # Comment system
│   │   ├── CommentSection.tsx
│   │   ├── CommentItem.tsx
│   │   ├── CommentForm.tsx
│   │   └── CommentThread.tsx
│   └── layout/             # Layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
├── pages/                  # Page components
│   ├── HomePage.tsx
│   ├── ProjectDetailPage.tsx
│   ├── SubmitProjectPage.tsx
│   ├── ProfilePage.tsx
│   └── SearchPage.tsx
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── useProjects.ts
│   ├── useVotes.ts
│   └── useComments.ts
├── lib/                    # Utilities and configurations
│   ├── supabase.ts         # Supabase client configuration
│   ├── auth.ts             # Authentication utilities
│   ├── database.ts         # Database queries
│   ├── utils.ts            # General utilities
│   └── validations.ts      # Zod schemas
├── types/                  # TypeScript definitions
│   ├── database.ts         # Database types
│   ├── auth.ts             # Auth types
│   └── api.ts              # API response types
└── styles/                 # Styling
    ├── globals.css         # Global styles
    └── components.css      # Component-specific styles
```

#### Key Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.51.0",
    "@hookform/resolvers": "^3.9.0",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.8",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0",
    "lucide-react": "^0.427.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-button": "^1.1.0",
    "@radix-ui/react-card": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-form": "^0.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "sonner": "^1.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "eslint": "^9.9.0",
    "prettier": "^3.3.0",
    "supabase": "^1.192.0"
  }
}
```

### Supabase Configuration

#### Database Setup
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables with proper relationships
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  year_of_study TEXT CHECK (year_of_study IN ('Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Staff', 'Faculty')),
  department TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#FF6B35',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  website_url TEXT,
  github_url TEXT,
  category_id UUID REFERENCES categories(id),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  upvotes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'featured', 'archived', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  thread_depth INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_category_id ON projects(category_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_upvotes ON projects(upvotes_count DESC);
CREATE INDEX idx_votes_project_id ON votes(project_id);
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Create triggers for updating counts
CREATE OR REPLACE FUNCTION update_project_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET upvotes_count = upvotes_count + 1 
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects 
    SET upvotes_count = upvotes_count - 1 
    WHERE id = OLD.project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_upvotes_count_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_upvotes_count();

CREATE OR REPLACE FUNCTION update_project_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_comments_count();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Row Level Security Policies
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Projects are publicly readable" ON projects
  FOR SELECT USING (status != 'draft' OR user_id = auth.uid());

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Categories are publicly readable" ON categories
  FOR SELECT USING (is_active = true);

-- Votes policies
CREATE POLICY "Votes are publicly readable" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote on projects" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are publicly readable" ON comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Comment likes policies
CREATE POLICY "Comment likes are publicly readable" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their comment likes" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id);
```

### Authentication Implementation

#### Supabase Client Configuration
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: `${window.location.origin}/auth/callback`,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

#### Authentication Hook
```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types/auth'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
        return
      }

      if (session?.user) {
        loadUserProfile(session.user)
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    })

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user)
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          error: null
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (user: User) => {
    try {
      // Validate email domain
      if (!user.email?.endsWith('@illinois.edu')) {
        await supabase.auth.signOut()
        setState(prev => ({
          ...prev,
          error: 'Only @illinois.edu email addresses are allowed',
          loading: false
        }))
        return
      }

      // Get or create user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata.full_name || '',
          avatar_url: user.user_metadata.avatar_url || '',
          username: user.email.split('@')[0] // Default username from email
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single()

        if (createError) {
          setState(prev => ({ ...prev, error: createError.message, loading: false }))
          return
        }

        setState({
          user,
          profile: createdProfile,
          session: await supabase.auth.getSession().then(res => res.data.session),
          loading: false,
          error: null
        })
      } else if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }))
      } else {
        setState({
          user,
          profile,
          session: await supabase.auth.getSession().then(res => res.data.session),
          loading: false,
          error: null
        })
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
        loading: false
      }))
    }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: 'illinois.edu' // Restrict to Illinois domain
        },
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    ...state,
    signInWithGoogle,
    signOut
  }
}
```

### Database Queries

#### Projects Service
```typescript
// lib/database.ts
import { supabase } from './supabase'
import type { Project, ProjectInsert, ProjectUpdate } from '@/types/database'

export class ProjectsService {
  // Get all projects with user info and vote status
  static async getProjects(options?: {
    category?: string
    search?: string
    sortBy?: 'recent' | 'popular' | 'featured'
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('projects')
      .select(`
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
          color
        ),
        user_voted:votes(count)
      `)
      .eq('status', 'active')

    // Apply filters
    if (options?.category) {
      query = query.eq('category_id', options.category)
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,tagline.ilike.%${options.search}%`)
    }

    // Apply sorting
    switch (options?.sortBy) {
      case 'popular':
        query = query.order('upvotes_count', { ascending: false })
        break
      case 'featured':
        query = query.eq('status', 'featured').order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    return query
  }

  // Get single project with full details
  static async getProject(id: string) {
    return supabase
      .from('projects')
      .select(`
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
      `)
      .eq('id', id)
      .single()
  }

  // Create new project
  static async createProject(project: ProjectInsert) {
    return supabase
      .from('projects')
      .insert(project)
      .select()
      .single()
  }

  // Update project
  static async updateProject(id: string, updates: ProjectUpdate) {
    return supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
  }

  // Delete project
  static async deleteProject(id: string) {
    return supabase
      .from('projects')
      .delete()
      .eq('id', id)
  }

  // Vote on project
  static async voteProject(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to vote')

    return supabase
      .from('votes')
      .insert({ project_id: projectId, user_id: user.id })
  }

  // Remove vote
  static async unvoteProject(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be authenticated to vote')

    return supabase
      .from('votes')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id)
  }

  // Check if user voted on project
  static async hasUserVoted(projectId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('votes')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    return !error && !!data
  }
}
```

### Real-time Features

#### Real-time Subscriptions
```typescript
// hooks/useRealtime.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useProjectSubscription(projectId: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const projectChannel = supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          // Handle vote changes
          window.dispatchEvent(new CustomEvent('vote-change', {
            detail: { projectId, payload }
          }))
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          // Handle comment changes
          window.dispatchEvent(new CustomEvent('comment-change', {
            detail: { projectId, payload }
          }))
        }
      )
      .subscribe()

    setChannel(projectChannel)

    return () => {
      if (projectChannel) {
        supabase.removeChannel(projectChannel)
      }
    }
  }, [projectId])

  return channel
}

// Usage in components
export function useVoteUpdates(projectId: string) {
  const [voteCount, setVoteCount] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)

  useProjectSubscription(projectId)

  useEffect(() => {
    const handleVoteChange = (event: CustomEvent) => {
      if (event.detail.projectId === projectId) {
        // Refresh vote data
        ProjectsService.getProject(projectId).then(({ data }) => {
          if (data) {
            setVoteCount(data.upvotes_count)
          }
        })
      }
    }

    window.addEventListener('vote-change', handleVoteChange as EventListener)
    return () => {
      window.removeEventListener('vote-change', handleVoteChange as EventListener)
    }
  }, [projectId])

  return { voteCount, hasVoted, setVoteCount, setHasVoted }
}
```

### Performance Optimizations

#### React Query Setup
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404s
        if (error?.message?.includes('404')) return false
        return failureCount < 3
      }
    }
  }
})

// Query keys
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const
  },
  users: {
    all: ['users'] as const,
    profile: (id: string) => [...queryKeys.users.all, 'profile', id] as const
  },
  comments: {
    all: ['comments'] as const,
    byProject: (projectId: string) => [...queryKeys.comments.all, 'project', projectId] as const
  }
}
```

#### Custom Hooks with React Query
```typescript
// hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ProjectsService } from '@/lib/database'
import { queryKeys } from '@/lib/queryClient'

export function useProjects(options?: {
  category?: string
  search?: string
  sortBy?: 'recent' | 'popular' | 'featured'
}) {
  const filterKey = JSON.stringify(options || {})
  
  return useQuery({
    queryKey: queryKeys.projects.list(filterKey),
    queryFn: () => ProjectsService.getProjects(options),
    keepPreviousData: true
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => ProjectsService.getProject(id),
    enabled: !!id
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ProjectsService.createProject,
    onSuccess: () => {
      // Invalidate projects lists
      queryClient.invalidateQueries(queryKeys.projects.lists())
    }
  })
}

export function useVoteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, isVoting }: { projectId: string; isVoting: boolean }) => {
      return isVoting 
        ? ProjectsService.voteProject(projectId)
        : ProjectsService.unvoteProject(projectId)
    },
    onSuccess: (_, { projectId }) => {
      // Invalidate specific project and lists
      queryClient.invalidateQueries(queryKeys.projects.detail(projectId))
      queryClient.invalidateQueries(queryKeys.projects.lists())
    }
  })
}
```

This technical specification provides the detailed implementation roadmap for building IlliniHunt V2 with modern, reliable technology stack focused on developer experience and user satisfaction.