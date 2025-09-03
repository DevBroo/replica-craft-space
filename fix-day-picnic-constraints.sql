-- Fix Day Picnic Property Constraints
-- This script ensures Day Picnic properties can be created without room-related constraint violations

-- First, let's check what constraints exist
-- SELECT constraint_name, constraint_type, check_clause 
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
-- WHERE tc.table_name = 'properties' AND tc.constraint_type = 'CHECK';

-- Temporarily disable the problematic constraints for Day Picnic properties
-- We'll modify the constraints to allow NULL values for Day Picnic properties

-- Drop the existing constraints
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS check_rooms_count_positive;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS check_capacity_per_room_positive;

-- Recreate constraints that allow NULL for Day Picnic properties
ALTER TABLE public.properties 
ADD CONSTRAINT check_rooms_count_positive 
CHECK (
  rooms_count IS NULL OR 
  rooms_count > 0 OR 
  (property_type = 'Day Picnic' AND rooms_count = 0)
);

ALTER TABLE public.properties 
ADD CONSTRAINT check_capacity_per_room_positive 
CHECK (
  capacity_per_room IS NULL OR 
  capacity_per_room > 0 OR 
  (property_type = 'Day Picnic' AND capacity_per_room IS NULL)
);

-- Ensure the day picnic capacity constraint is correct
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS check_day_picnic_capacity_positive;
ALTER TABLE public.properties 
ADD CONSTRAINT check_day_picnic_capacity_positive 
CHECK (
  day_picnic_capacity IS NULL OR 
  day_picnic_capacity > 0
);

-- Update the trigger function to handle edge cases better
CREATE OR REPLACE FUNCTION public.calculate_max_guests()
RETURNS TRIGGER AS $$
BEGIN
  -- For day picnic properties, use day_picnic_capacity
  IF NEW.property_type = 'Day Picnic' THEN
    IF NEW.day_picnic_capacity IS NOT NULL AND NEW.day_picnic_capacity > 0 THEN
      NEW.max_guests = NEW.day_picnic_capacity;
    ELSE
      -- Default to 20 if day_picnic_capacity is not set
      NEW.max_guests = COALESCE(NEW.max_guests, 20);
    END IF;
  -- For stay properties, calculate from rooms and capacity per room
  ELSIF NEW.property_type != 'Day Picnic' AND NEW.rooms_count IS NOT NULL AND NEW.capacity_per_room IS NOT NULL THEN
    NEW.max_guests = NEW.rooms_count * NEW.capacity_per_room;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Test the constraints by trying to insert a sample Day Picnic property
-- This should work without constraint violations
/*
INSERT INTO public.properties (
  owner_id, 
  title, 
  description, 
  property_type, 
  address,
  location,
  day_picnic_capacity,
  rooms_count,
  capacity_per_room,
  bedrooms,
  bathrooms,
  pricing
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- dummy owner_id for test
  'Test Day Picnic',
  'Test description',
  'Day Picnic',
  'Test Address',
  '{"city": "Test City", "state": "Test State"}',
  25,
  NULL,
  NULL,
  0,
  1,
  '{"currency": "INR", "daily_rate": 1500}'
);

-- Clean up test data
DELETE FROM public.properties WHERE title = 'Test Day Picnic';
*/

SELECT 'Day Picnic constraints updated successfully!' as message;
