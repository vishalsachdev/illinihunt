-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true);

-- Storage policies for project-images bucket
CREATE POLICY "Anyone can view project images" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-images' 
    AND auth.role() = 'authenticated'
    AND (CASE 
      WHEN position('.' in name) > 0 
      THEN lower(substring(name from '\.([^.]*)$')) 
      ELSE '' 
    END) IN ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

CREATE POLICY "Users can update their own project images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own project images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );