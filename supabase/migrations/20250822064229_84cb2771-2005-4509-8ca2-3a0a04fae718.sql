-- Add capacity fields to properties table
ALTER TABLE public.properties 
ADD COLUMN rooms_count integer,
ADD COLUMN capacity_per_room integer,
ADD COLUMN day_picnic_capacity integer;

-- Update existing properties with reasonable defaults based on property type
UPDATE public.properties 
SET 
  rooms_count = CASE 
    WHEN property_type = 'Day Picnic' THEN NULL
    WHEN bedrooms > 0 THEN bedrooms
    ELSE 1
  END,
  capacity_per_room = CASE 
    WHEN property_type = 'Day Picnic' THEN NULL
    WHEN bedrooms > 0 AND max_guests > 0 THEN CEIL(max_guests::decimal / GREATEST(bedrooms, 1))
    ELSE 2
  END,
  day_picnic_capacity = CASE 
    WHEN property_type = 'Day Picnic' THEN max_guests
    ELSE NULL
  END;

-- Add check constraints for data validity
ALTER TABLE public.properties 
ADD CONSTRAINT check_rooms_count_positive 
CHECK (rooms_count IS NULL OR rooms_count > 0);

ALTER TABLE public.properties 
ADD CONSTRAINT check_capacity_per_room_positive 
CHECK (capacity_per_room IS NULL OR capacity_per_room > 0);

ALTER TABLE public.properties 
ADD CONSTRAINT check_day_picnic_capacity_positive 
CHECK (day_picnic_capacity IS NULL OR day_picnic_capacity > 0);

-- Add a trigger to automatically calculate max_guests when rooms/capacity fields change
CREATE OR REPLACE FUNCTION public.calculate_max_guests()
RETURNS TRIGGER AS $$
BEGIN
  -- For day picnic properties, use day_picnic_capacity
  IF NEW.property_type = 'Day Picnic' AND NEW.day_picnic_capacity IS NOT NULL THEN
    NEW.max_guests = NEW.day_picnic_capacity;
  -- For stay properties, calculate from rooms and capacity per room
  ELSIF NEW.property_type != 'Day Picnic' AND NEW.rooms_count IS NOT NULL AND NEW.capacity_per_room IS NOT NULL THEN
    NEW.max_guests = NEW.rooms_count * NEW.capacity_per_room;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_max_guests
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_max_guests();