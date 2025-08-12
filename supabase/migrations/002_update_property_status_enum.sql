-- Update property_status enum to include new status values
-- First, we need to alter the enum type to include new values

-- Add new enum values
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'maintenance';

-- Update existing properties that might have invalid status values
-- This is a safety measure in case any properties have invalid status values
UPDATE properties 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'approved', 'rejected', 'inactive', 'active', 'maintenance');

-- Add a comment to document the change
COMMENT ON TYPE property_status IS 'Property status: pending, approved, rejected, inactive, active, maintenance';
