
-- 1) Add new duration category column on properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS day_picnic_duration_category text;

-- Add a safe check constraint allowing only expected values (or NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'properties_day_picnic_duration_category_check'
  ) THEN
    ALTER TABLE public.properties
    ADD CONSTRAINT properties_day_picnic_duration_category_check
    CHECK (
      day_picnic_duration_category IS NULL
      OR day_picnic_duration_category IN ('half_day','full_day','extended_day')
    );
  END IF;
END $$;

-- 2) Backfill existing Day Picnic properties using their longest package duration
WITH pkg_max AS (
  SELECT property_id, MAX(duration_hours) AS max_dur
  FROM public.day_picnic_packages
  GROUP BY property_id
)
UPDATE public.properties p
SET day_picnic_duration_category = CASE
  WHEN pkg_max.max_dur >= 10 THEN 'extended_day'
  WHEN pkg_max.max_dur >= 6 THEN 'full_day'
  WHEN pkg_max.max_dur >= 4 THEN 'half_day'
  ELSE NULL
END
FROM pkg_max
WHERE p.id = pkg_max.property_id
  AND p.day_picnic_duration_category IS NULL;

-- 3) Index to support filtering by new category
CREATE INDEX IF NOT EXISTS idx_properties_day_picnic_duration_category
  ON public.properties (day_picnic_duration_category);
