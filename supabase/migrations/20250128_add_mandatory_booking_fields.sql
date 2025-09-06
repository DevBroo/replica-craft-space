-- Add mandatory guest information fields to bookings table
-- This ensures every booking has complete guest information

-- Add the new mandatory fields to the bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS guest_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS guest_phone TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS guest_date_of_birth DATE;

-- Update existing bookings to have default values to prevent issues
UPDATE public.bookings 
SET 
  guest_name = COALESCE(
    (booking_details->>'customer_name'),
    (booking_details->'customer_details'->>'name'),
    'Guest'
  ),
  guest_phone = COALESCE(
    (booking_details->>'customer_phone'),
    (booking_details->'customer_details'->>'phone'),
    ''
  )
WHERE guest_name = '' OR guest_name IS NULL OR guest_phone = '' OR guest_phone IS NULL;

-- Add constraints to ensure these fields are always provided
ALTER TABLE public.bookings 
ALTER COLUMN guest_name SET NOT NULL,
ALTER COLUMN guest_phone SET NOT NULL,
ALTER COLUMN guest_date_of_birth SET NOT NULL;

-- Add check constraints for data validation
ALTER TABLE public.bookings 
ADD CONSTRAINT check_guest_name_not_empty CHECK (length(trim(guest_name)) > 0),
ADD CONSTRAINT check_guest_phone_not_empty CHECK (length(trim(guest_phone)) > 0),
ADD CONSTRAINT check_guest_dob_reasonable CHECK (guest_date_of_birth >= '1900-01-01' AND guest_date_of_birth <= CURRENT_DATE);

-- Add index for better query performance on guest information
CREATE INDEX IF NOT EXISTS idx_bookings_guest_info ON public.bookings(guest_name, guest_phone);

-- Update the updated_at trigger to include new fields
CREATE OR REPLACE FUNCTION public.update_booking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_updated_at();
