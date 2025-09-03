-- SIMPLE WORKING FIX - No permissions needed
-- Just create a basic bucket with basic policies

-- Create or update the bucket to be completely public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'public-images', 
    'public-images', 
    true, 
    52428800,
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Create the simplest possible policies
CREATE POLICY "public_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'public-images');
CREATE POLICY "public_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public-images');
CREATE POLICY "public_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'public-images');
CREATE POLICY "public_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'public-images');

SELECT 'Simple bucket created - update your code to use "public-images"' as message;
