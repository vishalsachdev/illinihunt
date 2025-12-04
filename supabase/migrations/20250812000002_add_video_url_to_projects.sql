-- Migration: Add video_url field to projects table
-- Purpose: Allow students to embed YouTube videos on their project pages
-- Date: 2025-08-12

-- Add video_url column to projects table
ALTER TABLE projects
ADD COLUMN video_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN projects.video_url IS
  'Optional YouTube video URL for project demo/pitch. Will be validated and rendered as safe embed on project detail page.';
