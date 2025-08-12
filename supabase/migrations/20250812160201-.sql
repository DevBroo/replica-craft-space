-- Update RLS policy to allow public access to approved properties only
DROP POLICY IF EXISTS "Public can view approved properties" ON public.properties;

CREATE POLICY "Public can view approved properties" 
ON public.properties 
FOR SELECT 
USING (status = 'approved');