-- Collections and Bookmarks Feature Migration
-- Adds bookmarking and collection functionality for users to organize projects

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Create collections table
CREATE TABLE public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  projects_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection_projects table (many-to-many relationship)
CREATE TABLE public.collection_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, project_id)
);

-- Create indexes for performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_project_id ON bookmarks(project_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_is_public ON collections(is_public);
CREATE INDEX idx_collections_created_at ON collections(created_at DESC);
CREATE INDEX idx_collections_projects_count ON collections(projects_count DESC);

CREATE INDEX idx_collection_projects_collection_id ON collection_projects(collection_id);
CREATE INDEX idx_collection_projects_project_id ON collection_projects(project_id);
CREATE INDEX idx_collection_projects_added_at ON collection_projects(added_at DESC);

-- Create function to update collections projects count
CREATE OR REPLACE FUNCTION update_collection_projects_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections 
    SET projects_count = projects_count + 1 
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections 
    SET projects_count = projects_count - 1 
    WHERE id = OLD.collection_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for collections projects count
CREATE TRIGGER collection_projects_count_trigger
  AFTER INSERT OR DELETE ON collection_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_projects_count();

-- Create trigger for collections updated_at
CREATE TRIGGER update_collections_updated_at 
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful views for common queries
CREATE VIEW public.user_bookmarks_with_projects AS
SELECT 
  b.id,
  b.user_id,
  b.created_at as bookmarked_at,
  p.id as project_id,
  p.name as project_name,
  p.tagline,
  p.image_url,
  p.upvotes_count,
  p.status,
  p.created_at as project_created_at,
  u.username as project_author,
  c.name as category_name,
  c.color as category_color
FROM bookmarks b
JOIN projects p ON b.project_id = p.id
JOIN users u ON p.user_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.status = 'active' OR p.status = 'featured';

CREATE VIEW public.public_collections_with_stats AS
SELECT 
  c.id,
  c.name,
  c.description,
  c.projects_count,
  c.created_at,
  u.username as owner_username,
  u.full_name as owner_name,
  u.avatar_url as owner_avatar
FROM collections c
JOIN users u ON c.user_id = u.id
WHERE c.is_public = true
ORDER BY c.projects_count DESC, c.created_at DESC;