-- Add columns that the application code expects but are missing from the database.
-- Idempotent: safe to re-run.

-- restaurants: dashboard config + branding extras
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS slogan text,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb,
  ADD COLUMN IF NOT EXISTS filter_settings jsonb;

-- menu_items: bilingual fields, sold-out flag, time-based availability
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS is_sold_out boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS availability_schedule jsonb;

COMMENT ON COLUMN public.menu_items.availability_schedule IS
  'JSON: { enabled: bool, slots: [{ label: string, from: "HH:MM", to: "HH:MM" }] }';
