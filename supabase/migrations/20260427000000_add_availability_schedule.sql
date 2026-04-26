-- Add time-based availability schedule to menu items
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS availability_schedule jsonb DEFAULT NULL;

COMMENT ON COLUMN public.menu_items.availability_schedule IS
  'JSON: { enabled: bool, slots: [{ label: string, from: "HH:MM", to: "HH:MM" }] }';
