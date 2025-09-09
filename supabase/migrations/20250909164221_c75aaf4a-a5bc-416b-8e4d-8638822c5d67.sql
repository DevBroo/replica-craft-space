-- Add mandatory guest information fields to the bookings table
-- This migration adds the required fields that BookingService expects

-- Add the mandatory guest information columns
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_phone TEXT,
ADD COLUMN IF NOT EXISTS guest_date_of_birth DATE;

-- Add constraints to ensure data integrity
-- Note: We'll make these NOT NULL after we populate existing records

-- Update existing records with placeholder data where needed
UPDATE public.bookings 
SET 
  guest_name = COALESCE(guest_name, 'Guest'),
  guest_phone = COALESCE(guest_phone, '0000000000'),
  guest_date_of_birth = COALESCE(guest_date_of_birth, '1990-01-01'::date)
WHERE guest_name IS NULL OR guest_phone IS NULL OR guest_date_of_birth IS NULL;

-- Now add NOT NULL constraints
ALTER TABLE public.bookings 
ALTER COLUMN guest_name SET NOT NULL,
ALTER COLUMN guest_phone SET NOT NULL,
ALTER COLUMN guest_date_of_birth SET NOT NULL;

-- Add some validation constraints
ALTER TABLE public.bookings 
ADD CONSTRAINT check_guest_name_not_empty CHECK (length(trim(guest_name)) > 0),
ADD CONSTRAINT check_guest_phone_not_empty CHECK (length(trim(guest_phone)) > 0),
ADD CONSTRAINT check_guest_dob_reasonable CHECK (guest_date_of_birth BETWEEN '1900-01-01'::date AND CURRENT_DATE);

-- Add index for better performance on guest searches
CREATE INDEX IF NOT EXISTS idx_bookings_guest_info ON public.bookings(guest_name, guest_phone);