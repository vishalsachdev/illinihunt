-- Category System Redesign: MVP Clean Slate Approach
-- Replace technology-focused categories with problem-focused categories
-- Since we're still in MVP, we can delete existing test data

-- Delete existing test data (MVP clean slate)
DELETE FROM comment_likes;
DELETE FROM comments;
DELETE FROM votes;
DELETE FROM projects;
DELETE FROM categories;

-- Insert new problem-focused categories
INSERT INTO public.categories (name, description, icon, color) VALUES
  (
    'Learning & Education Tools', 
    'Educational platforms, study aids, tutoring systems, course management tools, and learning applications that help students and educators', 
    'GraduationCap', 
    '#FF6B35'
  ),
  (
    'Social & Communication', 
    'Social networks, messaging platforms, community forums, collaboration tools, and applications that connect people', 
    'Users', 
    '#13294B'
  ),
  (
    'Productivity & Organization', 
    'Task management, scheduling, note-taking, workflow automation, and tools that help organize work and life', 
    'Calendar', 
    '#4B7BA8'
  ),
  (
    'Health & Wellness', 
    'Fitness tracking, mental health support, medical devices, wellness platforms, and applications promoting healthy living', 
    'Heart', 
    '#FFB577'
  ),
  (
    'Creative & Entertainment', 
    'Games, media platforms, creative tools, artistic applications, and projects focused on entertainment and creativity', 
    'Palette', 
    '#FF6B35'
  ),
  (
    'Research & Data Analysis', 
    'Data visualization, research tools, academic publications, analysis platforms, and scientific computing applications', 
    'BarChart', 
    '#13294B'
  ),
  (
    'Business & Entrepreneurship', 
    'Fintech solutions, e-commerce platforms, startup tools, business applications, and entrepreneurial ventures', 
    'TrendingUp', 
    '#4B7BA8'
  ),
  (
    'Emerging Technology', 
    'AI/ML applications, IoT devices, blockchain projects, VR/AR experiences, and cutting-edge technology implementations', 
    'Zap', 
    '#FFB577'
  );

-- Create sample projects to demonstrate new categorization (optional for testing)
-- These can be removed before public launch
COMMENT ON TABLE categories IS 'Problem-focused categories that describe what the project does, not just what technology it uses. Updated for MVP phase with clean slate approach.';