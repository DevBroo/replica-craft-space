-- Seed default app_settings for appearance to prevent 406 errors and timeouts
INSERT INTO public.app_settings (key, category, value, created_at, updated_at) 
VALUES (
  'appearance',
  'appearance',
  '{"primaryColor":"#3B82F6","secondaryColor":"#10B981","fontFamily":"Inter","logoUrl":"","customCSS":"","theme":"light"}',
  now(),
  now()
) ON CONFLICT (key) DO NOTHING;