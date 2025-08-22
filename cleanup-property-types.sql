-- Optional SQL script to standardize existing property types in the database
-- Run this if you want to clean up existing inconsistent data

-- Update all variations of day picnic property types to 'Day Picnic'
UPDATE properties 
SET property_type = 'Day Picnic' 
WHERE property_type IN ('day_picnic', 'day-picnic', 'daypicnic', 'Day-Picnic', 'DAY_PICNIC', 'DAY PICNIC')
   OR LOWER(property_type) IN ('day picnic', 'day_picnic', 'day-picnic');

-- Also update in properties_public view if needed
UPDATE properties_public
SET property_type = 'Day Picnic' 
WHERE property_type IN ('day_picnic', 'day-picnic', 'daypicnic', 'Day-Picnic', 'DAY_PICNIC', 'DAY PICNIC')
   OR LOWER(property_type) IN ('day picnic', 'day_picnic', 'day-picnic');

-- Show the affected rows for verification
SELECT property_type, COUNT(*) as count 
FROM properties 
WHERE property_type ILIKE '%picnic%' 
GROUP BY property_type;