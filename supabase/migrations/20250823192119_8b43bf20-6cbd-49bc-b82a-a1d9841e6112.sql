-- Fix the CHECK constraint on day_picnic_option_prices to allow 'duration' option_type
ALTER TABLE day_picnic_option_prices 
DROP CONSTRAINT IF EXISTS day_picnic_option_prices_option_type_check;

-- Add new constraint that includes 'duration' as a valid option_type
ALTER TABLE day_picnic_option_prices 
ADD CONSTRAINT day_picnic_option_prices_option_type_check 
CHECK (option_type IN ('inclusion', 'add_on', 'duration'));