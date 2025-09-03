        -- Create locations table for dynamic location management
        CREATE TABLE IF NOT EXISTS public.locations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            state VARCHAR(255) NOT NULL,
            region VARCHAR(100) NOT NULL,
            category VARCHAR(50) NOT NULL DEFAULT 'general',
            cover_image_url TEXT,
            description TEXT,
            featured BOOLEAN DEFAULT false,
            trending BOOLEAN DEFAULT false,
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            created_by UUID REFERENCES auth.users(id),
            
            -- Add unique constraint on name and state combination
            UNIQUE(name, state)
        );

        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_locations_category ON public.locations(category);
        CREATE INDEX IF NOT EXISTS idx_locations_featured ON public.locations(featured);
        CREATE INDEX IF NOT EXISTS idx_locations_trending ON public.locations(trending);
        CREATE INDEX IF NOT EXISTS idx_locations_active ON public.locations(is_active);
        CREATE INDEX IF NOT EXISTS idx_locations_display_order ON public.locations(display_order);

        -- Enable Row Level Security
        ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Locations are viewable by everyone" ON public.locations
            FOR SELECT USING (is_active = true);

        CREATE POLICY "Locations can be managed by admins" ON public.locations
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role = 'admin'
                )
            );

        -- Create function to automatically update updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = timezone('utc'::text, now());
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create trigger for updated_at
        CREATE TRIGGER update_locations_updated_at 
            BEFORE UPDATE ON public.locations 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        -- Create city-photos storage bucket
        DO $$
        BEGIN
        BEGIN
            INSERT INTO storage.buckets (id, name, public) VALUES ('city-photos', 'city-photos', true);
        EXCEPTION
            WHEN unique_violation THEN NULL;
        END;
        END $$;

        -- Create storage policies for city-photos bucket
        DO $$
        BEGIN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Public can view city photos" ON storage.objects;
        DROP POLICY IF EXISTS "Admins can upload city photos" ON storage.objects;
        DROP POLICY IF EXISTS "Admins can update city photos" ON storage.objects;
        DROP POLICY IF EXISTS "Admins can delete city photos" ON storage.objects;

        -- Create new policies
        CREATE POLICY "Public can view city photos" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'city-photos');

          CREATE POLICY "Admins can upload city photos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'city-photos' AND public.is_admin());

  CREATE POLICY "Admins can update city photos" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'city-photos' AND public.is_admin());

  CREATE POLICY "Admins can delete city photos" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'city-photos' AND public.is_admin());
        END $$;

        -- No default data insertion - admins will create their own location cards
