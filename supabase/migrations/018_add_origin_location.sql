-- Add origin_location field to persons table for tracking where clients came from
-- This supports the Grossmont Street Reach requirement for "Where They Were From"

-- Add text field for the origin location description (city, state, or general area)
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS origin_location TEXT;

-- Add optional GPS coordinates for origin location (for heat map visualization)
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS origin_latitude DOUBLE PRECISION;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS origin_longitude DOUBLE PRECISION;

-- Add index for origin location queries
CREATE INDEX IF NOT EXISTS idx_persons_origin_location ON public.persons(origin_location);

-- Add index for origin GPS coordinates (for heat map queries)
CREATE INDEX IF NOT EXISTS idx_persons_origin_coords ON public.persons(origin_latitude, origin_longitude);

-- Add comments for documentation
COMMENT ON COLUMN public.persons.origin_location IS 'Where the client was originally from (city, state, or general description)';
COMMENT ON COLUMN public.persons.origin_latitude IS 'GPS latitude of origin location (optional, for heat map visualization)';
COMMENT ON COLUMN public.persons.origin_longitude IS 'GPS longitude of origin location (optional, for heat map visualization)';
