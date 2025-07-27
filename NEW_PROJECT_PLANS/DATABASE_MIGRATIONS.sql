-- IlliniHunt V2 Database Setup
-- Complete database schema for Supabase PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
-- This table stores additional user profile information
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
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table for project classification
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name
  color TEXT DEFAULT '#FF6B35', -- UIUC orange
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (main content)
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
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'featured', 'archived', 'draft', 'under_review')),
  featured_at TIMESTAMP WITH TIME ZONE,
  featured_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table for project upvoting
CREATE TABLE public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Comments table with threading support
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  thread_depth INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment likes table
CREATE TABLE public.comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- User follows table (for future social features)
CREATE TABLE public.user_follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Project bookmarks table
CREATE TABLE public.project_bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Activity feed table for user actions
CREATE TABLE public.activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('project_created', 'project_voted', 'comment_posted', 'user_followed')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'comment', 'user')),
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table for content moderation
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reported_entity_type TEXT NOT NULL CHECK (reported_entity_type IN ('project', 'comment', 'user')),
  reported_entity_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'copyright', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_category_id ON projects(category_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_upvotes ON projects(upvotes_count DESC);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_featured_at ON projects(featured_at DESC) WHERE featured_at IS NOT NULL;

-- Full-text search index for projects
CREATE INDEX idx_projects_search ON projects USING GIN (
  to_tsvector('english', name || ' ' || tagline || ' ' || description)
);

-- Votes indexes
CREATE INDEX idx_votes_project_id ON votes(project_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_created_at ON votes(created_at DESC);

-- Comments indexes
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_thread_depth ON comments(thread_depth);

-- Comment likes indexes
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Activity indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_type ON activities(activity_type);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update project upvotes count
CREATE OR REPLACE FUNCTION update_project_upvotes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET upvotes_count = upvotes_count + 1 
    WHERE id = NEW.project_id;
    
    -- Create activity record
    INSERT INTO activities (user_id, activity_type, entity_type, entity_id)
    VALUES (NEW.user_id, 'project_voted', 'project', NEW.project_id);
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects 
    SET upvotes_count = upvotes_count - 1 
    WHERE id = OLD.project_id;
    
    -- Remove activity record
    DELETE FROM activities 
    WHERE user_id = OLD.user_id 
    AND activity_type = 'project_voted' 
    AND entity_id = OLD.project_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update project comments count
CREATE OR REPLACE FUNCTION update_project_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.project_id;
    
    -- Create activity record
    INSERT INTO activities (user_id, activity_type, entity_type, entity_id)
    VALUES (NEW.user_id, 'comment_posted', 'comment', NEW.id);
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.project_id;
    
    -- Remove activity record
    DELETE FROM activities 
    WHERE activity_type = 'comment_posted' 
    AND entity_id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.comment_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to set thread depth for comments
CREATE OR REPLACE FUNCTION set_comment_thread_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.thread_depth = 0;
  ELSE
    SELECT thread_depth + 1 INTO NEW.thread_depth
    FROM comments
    WHERE id = NEW.parent_id;
    
    -- Limit thread depth to 3 levels
    IF NEW.thread_depth > 2 THEN
      RAISE EXCEPTION 'Maximum thread depth of 3 levels exceeded';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create activity on project creation
CREATE OR REPLACE FUNCTION create_project_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activities (user_id, activity_type, entity_type, entity_id)
  VALUES (NEW.user_id, 'project_created', 'project', NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers
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

-- Count update triggers
CREATE TRIGGER project_upvotes_count_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_upvotes_count();

CREATE TRIGGER project_comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_comments_count();

CREATE TRIGGER comment_likes_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- Comment thread depth trigger
CREATE TRIGGER set_comment_thread_depth_trigger
  BEFORE INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION set_comment_thread_depth();

-- Activity creation triggers
CREATE TRIGGER create_project_activity_trigger
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_project_activity();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Projects are publicly readable" ON projects
  FOR SELECT USING (
    status IN ('active', 'featured') OR 
    (status = 'draft' AND user_id = auth.uid()) OR
    (status = 'under_review' AND user_id = auth.uid())
  );

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

CREATE POLICY "Users can soft delete own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Comment likes policies
CREATE POLICY "Comment likes are publicly readable" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their comment likes" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "Follows are publicly readable" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Project bookmarks policies
CREATE POLICY "Users can read own bookmarks" ON project_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark projects" ON project_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks" ON project_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can read public activities" ON activities
  FOR SELECT USING (true);

-- Reports policies (only authenticated users can create reports)
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can read own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, description, icon, color, sort_order) VALUES
  ('Web Development', 'Web applications, websites, and web tools', 'Globe', '#FF6B35', 1),
  ('Mobile Apps', 'iOS, Android, and cross-platform mobile applications', 'Smartphone', '#13294B', 2),
  ('AI & Machine Learning', 'Artificial intelligence, ML models, and data science projects', 'Brain', '#4B7BA8', 3),
  ('Hardware', 'IoT devices, robotics, and physical computing projects', 'Cpu', '#FFB577', 4),
  ('Games', 'Video games, game engines, and interactive entertainment', 'Gamepad2', '#FF6B35', 5),
  ('Design', 'UI/UX design, graphics, and design tools', 'Palette', '#13294B', 6),
  ('Research', 'Academic research projects and scientific tools', 'FlaskConical', '#4B7BA8', 7),
  ('Social Impact', 'Projects addressing social issues and community needs', 'Heart', '#FFB577', 8),
  ('Developer Tools', 'Libraries, frameworks, and development utilities', 'Code', '#FF6B35', 9),
  ('Other', 'Projects that don''t fit other categories', 'MoreHorizontal', '#6B7280', 10);

-- =====================================================
-- FUNCTIONS FOR APPLICATION USE
-- =====================================================

-- Function to get trending projects
CREATE OR REPLACE FUNCTION get_trending_projects(days_back INTEGER DEFAULT 7, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  project_id UUID,
  name TEXT,
  tagline TEXT,
  upvotes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  trend_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.tagline,
    p.upvotes_count,
    p.comments_count,
    p.created_at,
    -- Calculate trend score based on votes and comments in the time window
    (
      (p.upvotes_count * 2.0) + 
      (p.comments_count * 1.0) + 
      (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400.0 * -0.1)
    )::NUMERIC as trend_score
  FROM projects p
  WHERE 
    p.status = 'active' AND
    p.created_at >= NOW() - INTERVAL '1 day' * days_back
  ORDER BY trend_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search projects with full-text search
CREATE OR REPLACE FUNCTION search_projects(search_query TEXT)
RETURNS TABLE (
  project_id UUID,
  name TEXT,
  tagline TEXT,
  description TEXT,
  upvotes_count INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.tagline,
    p.description,
    p.upvotes_count,
    ts_rank(
      to_tsvector('english', p.name || ' ' || p.tagline || ' ' || p.description),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM projects p
  WHERE 
    p.status IN ('active', 'featured') AND
    to_tsvector('english', p.name || ' ' || p.tagline || ' ' || p.description) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, p.upvotes_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  projects_count INTEGER,
  total_upvotes INTEGER,
  total_comments INTEGER,
  followers_count INTEGER,
  following_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM projects WHERE user_id = user_uuid AND status != 'draft'),
    (SELECT COALESCE(SUM(upvotes_count), 0)::INTEGER FROM projects WHERE user_id = user_uuid),
    (SELECT COUNT(*)::INTEGER FROM comments WHERE user_id = user_uuid),
    (SELECT COUNT(*)::INTEGER FROM user_follows WHERE following_id = user_uuid),
    (SELECT COUNT(*)::INTEGER FROM user_follows WHERE follower_id = user_uuid);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for projects with user and category information
CREATE VIEW projects_with_details AS
SELECT 
  p.*,
  u.username,
  u.full_name as user_full_name,
  u.avatar_url as user_avatar_url,
  c.name as category_name,
  c.color as category_color,
  c.icon as category_icon
FROM projects p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.status IN ('active', 'featured');

-- View for comment threads with user information
CREATE VIEW comments_with_details AS
SELECT 
  c.*,
  u.username,
  u.full_name as user_full_name,
  u.avatar_url as user_avatar_url
FROM comments c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.is_deleted = false;

-- =====================================================
-- STORAGE BUCKET SETUP (Run this in Supabase dashboard)
-- =====================================================

-- Create storage buckets for file uploads
-- Run these commands in the Supabase dashboard SQL editor

/*
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('project-images', 'project-images', true);

-- Set up storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Project images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-images');

CREATE POLICY "Users can upload project images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own project images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
*/