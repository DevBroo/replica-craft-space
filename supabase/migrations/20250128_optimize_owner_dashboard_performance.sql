-- Optimize database performance for owner dashboard queries
-- This migration adds indexes and optimizations for faster property loading

-- Add composite index for owner_id queries with common filters
CREATE INDEX IF NOT EXISTS idx_properties_owner_performance 
ON public.properties (owner_id, created_at DESC, status);

-- Add index for bookings by property_id for faster stats calculation
CREATE INDEX IF NOT EXISTS idx_bookings_property_stats 
ON public.bookings (property_id, status, created_at, check_in_date, check_out_date);

-- Add index for bookings total_amount for revenue calculations
CREATE INDEX IF NOT EXISTS idx_bookings_revenue 
ON public.bookings (property_id, total_amount) 
WHERE status = 'confirmed';

-- Add composite index for properties with ratings
CREATE INDEX IF NOT EXISTS idx_properties_ratings 
ON public.properties (owner_id, rating, review_count) 
WHERE rating > 0;

-- Add index for properties created this month (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_properties_recent 
ON public.properties (owner_id, created_at) 
WHERE created_at >= date_trunc('month', CURRENT_DATE);

-- Add partial index for active bookings (commonly queried)
CREATE INDEX IF NOT EXISTS idx_bookings_active 
ON public.bookings (property_id, check_out_date, status) 
WHERE status = 'confirmed' AND check_out_date >= CURRENT_DATE;

-- Analyze tables to update statistics for query planner
ANALYZE public.properties;
ANALYZE public.bookings;

-- Add comments for documentation
COMMENT ON INDEX idx_properties_owner_performance IS 'Optimizes owner property queries with status filtering';
COMMENT ON INDEX idx_bookings_property_stats IS 'Speeds up booking statistics calculations for dashboard';
COMMENT ON INDEX idx_bookings_revenue IS 'Optimizes revenue calculations for confirmed bookings';
COMMENT ON INDEX idx_properties_ratings IS 'Improves rating calculations for properties with ratings';
COMMENT ON INDEX idx_properties_recent IS 'Speeds up queries for recently created properties';
COMMENT ON INDEX idx_bookings_active IS 'Optimizes active booking counts for dashboard stats';
