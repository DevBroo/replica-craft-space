-- Create storage bucket for branding assets
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true);

-- Create RLS policies for branding bucket
CREATE POLICY "Admins can upload branding assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'branding' AND auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Admins can view branding assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'branding' AND auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Admins can update branding assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'branding' AND auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Admins can delete branding assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'branding' AND auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Public can view branding assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'branding');

-- Update app_settings table for extended appearance config
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'extended_config') THEN
    ALTER TABLE app_settings ADD COLUMN extended_config JSONB DEFAULT '{
      "branding": {
        "logo_url": "",
        "favicon_url": "",
        "company_name": "Picnify",
        "show_powered_by": true
      },
      "fonts": {
        "primary_font": "Inter",
        "secondary_font": "Inter",
        "custom_fonts": []
      },
      "layout": {
        "sidebar_position": "left",
        "content_layout": "card",
        "header_style": "default"
      },
      "background": {
        "type": "color",
        "value": "#ffffff",
        "image_url": "",
        "gradient": ""
      },
      "email_templates": {
        "header_logo": "",
        "footer_text": "",
        "primary_color": "#3B82F6"
      }
    }'::jsonb;
  END IF;
END $$;