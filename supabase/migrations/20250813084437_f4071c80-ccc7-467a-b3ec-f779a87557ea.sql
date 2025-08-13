-- Enhanced properties table schema for comprehensive property management
-- Add new columns for professional property listing requirements

-- Address enhancements
ALTER TABLE properties ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS coordinates JSONB; -- {lat, lng}

-- Bed configuration details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bed_configuration JSONB DEFAULT '{"beds": []}'::jsonb;

-- Business and legal requirements
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'moderate';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS arrival_instructions TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS payment_methods TEXT[] DEFAULT ARRAY['card', 'cash'];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS license_number TEXT;

-- Optional professional features
ALTER TABLE properties ADD COLUMN IF NOT EXISTS meal_plans TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_rules JSONB DEFAULT '{}'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS booking_rules JSONB DEFAULT '{}'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tax_information JSONB DEFAULT '{}'::jsonb;

-- Enhanced property validation
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_subtype TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_in_time TEXT DEFAULT '15:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_out_time TEXT DEFAULT '11:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS minimum_stay INTEGER DEFAULT 1;

-- Update existing amenities to support categorization
-- The amenities field will now support structured data for better organization