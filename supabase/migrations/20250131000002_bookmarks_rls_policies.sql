-- Add RLS policies for bookmarks table
-- This migration addresses the 404 errors when checking bookmark status

-- Enable RLS on bookmarks table  
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Bookmarks policies
CREATE POLICY "Users can view all bookmarks" ON bookmarks
  FOR SELECT USING (true);

CREATE POLICY "Users can create bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Collections policies (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'collections' 
    AND policyname = 'Users can view public collections'
  ) THEN
    ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view public collections" ON collections
      FOR SELECT USING (is_public = true OR user_id = auth.uid());
      
    CREATE POLICY "Users can create collections" ON collections
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update own collections" ON collections
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own collections" ON collections
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Collection projects policies (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'collection_projects' 
    AND policyname = 'Users can view collection projects'
  ) THEN
    ALTER TABLE collection_projects ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view collection projects" ON collection_projects
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM collections c 
          WHERE c.id = collection_id 
          AND (c.is_public = true OR c.user_id = auth.uid())
        )
      );
      
    CREATE POLICY "Users can add to own collections" ON collection_projects
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM collections c 
          WHERE c.id = collection_id 
          AND c.user_id = auth.uid()
        )
      );
      
    CREATE POLICY "Users can remove from own collections" ON collection_projects
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM collections c 
          WHERE c.id = collection_id 
          AND c.user_id = auth.uid()
        )
      );
  END IF;
END $$;