-- Review System RLS Policies
-- This script ensures proper access control for the guest review system

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Property owners can view reviews for their properties" ON public.reviews;

-- Enable RLS on reviews table (if not already enabled)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all reviews (for public property display)
CREATE POLICY "Users can view all reviews" ON public.reviews
  FOR SELECT USING (true);

-- Policy: Authenticated users can insert reviews for their own bookings
CREATE POLICY "Users can insert their own reviews" ON public.reviews
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = reviews.booking_id 
        AND bookings.user_id = auth.uid()
        AND bookings.status = 'completed'
        AND bookings.check_out_date <= CURRENT_DATE
    )
  );

-- Policy: Users can update their own reviews (within 30 days of creation)
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (
    auth.uid() = user_id AND
    created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
  )
  WITH CHECK (
    auth.uid() = user_id AND
    created_at >= (CURRENT_TIMESTAMP - INTERVAL '30 days')
  );

-- Policy: Users can delete their own reviews (within 7 days of creation)
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE USING (
    auth.uid() = user_id AND
    created_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days')
  );

-- Policy: Property owners can view reviews for their properties
CREATE POLICY "Property owners can view reviews for their properties" ON public.reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = reviews.property_id 
        AND properties.owner_id = auth.uid()
    )
  );

-- Create function to update property rating automatically
CREATE OR REPLACE FUNCTION update_property_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update property rating and review count
  UPDATE public.properties
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.reviews 
      WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews 
      WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    )
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update property ratings
DROP TRIGGER IF EXISTS update_property_rating_on_insert ON public.reviews;
DROP TRIGGER IF EXISTS update_property_rating_on_update ON public.reviews;
DROP TRIGGER IF EXISTS update_property_rating_on_delete ON public.reviews;

CREATE TRIGGER update_property_rating_on_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_property_rating();

CREATE TRIGGER update_property_rating_on_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_property_rating();

CREATE TRIGGER update_property_rating_on_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_property_rating();

-- Grant necessary permissions
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.reviews TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION update_property_rating() TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON public.reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- Add response field to reviews table for owner responses (if not exists)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'response') THEN
    ALTER TABLE public.reviews ADD COLUMN response TEXT;
    ALTER TABLE public.reviews ADD COLUMN response_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Policy: Property owners can respond to reviews on their properties
CREATE POLICY "Property owners can respond to reviews" ON public.reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = reviews.property_id 
        AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = reviews.property_id 
        AND properties.owner_id = auth.uid()
    )
  );


