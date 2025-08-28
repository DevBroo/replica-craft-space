-- Only add tables to realtime publication if not already present
DO $$
BEGIN
    -- Check if bookings is already in the publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;
    
    -- Check if properties is already in the publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'properties'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
    END IF;
END
$$;