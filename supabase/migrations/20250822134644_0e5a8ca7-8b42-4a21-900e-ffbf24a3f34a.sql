-- Add comprehensive property details to existing properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rooms_details JSONB DEFAULT '{
  "types": [],
  "configurations": {},
  "amenities_per_room": {}
}'::jsonb;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities_details JSONB DEFAULT '{
  "property_facilities": [],
  "room_features": [],
  "connectivity": {},
  "recreation": [],
  "services": [],
  "accessibility": []
}'::jsonb;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS safety_security JSONB DEFAULT '{
  "fire_safety": [],
  "security_features": [],
  "emergency_procedures": [],
  "health_safety": []
}'::jsonb;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS nearby_attractions JSONB DEFAULT '{
  "landmarks": [],
  "transport": {},
  "dining": [],
  "entertainment": [],
  "distances": {}
}'::jsonb;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS languages_spoken JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS seasonal_pricing JSONB DEFAULT '{
  "seasons": [],
  "special_rates": {},
  "discounts": {}
}'::jsonb;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS extra_services JSONB DEFAULT '{
  "meals": {},
  "transportation": [],
  "activities": [],
  "spa_wellness": []
}'::jsonb;

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS policies_extended JSONB DEFAULT '{
  "child_policy": {},
  "pet_policy": {},
  "smoking_policy": {},
  "damage_policy": {},
  "group_booking_policy": {}
}'::jsonb;

-- Create photos_with_captions table for detailed image management
CREATE TABLE IF NOT EXISTS public.photos_with_captions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  category TEXT, -- 'exterior', 'interior', 'room', 'bathroom', 'amenity', 'view', etc.
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on photos_with_captions
ALTER TABLE public.photos_with_captions ENABLE ROW LEVEL SECURITY;

-- RLS policies for photos_with_captions
CREATE POLICY "Property owners can manage their photos" ON public.photos_with_captions
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.properties p 
  WHERE p.id = photos_with_captions.property_id 
  AND p.owner_id = auth.uid()
));

CREATE POLICY "Public can view photos for approved properties" ON public.photos_with_captions
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.properties p 
  WHERE p.id = photos_with_captions.property_id 
  AND p.status = 'approved'
));

CREATE POLICY "Admins can manage all photos" ON public.photos_with_captions
FOR ALL USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_photos_updated_at
BEFORE UPDATE ON public.photos_with_captions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add star_rating field for self-reported property rating
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5);

-- Add more specific property subtypes
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS facilities JSONB DEFAULT '{
  "parking": {},
  "internet": {},
  "recreation": [],
  "business": [],
  "family": []
}'::jsonb;