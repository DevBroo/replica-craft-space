
BEGIN;

-- Expand allowed option_type values to include 'exclusion'
ALTER TABLE public.day_picnic_option_prices
  DROP CONSTRAINT IF EXISTS day_picnic_option_prices_option_type_check;

ALTER TABLE public.day_picnic_option_prices
  ADD CONSTRAINT day_picnic_option_prices_option_type_check
  CHECK (option_type = ANY (ARRAY['inclusion', 'add_on', 'exclusion', 'duration']));

COMMIT;
