-- Add subscription tracking fields to restaurants table
-- subscription_status: trial | active | expired
-- trial_ends_at: 14 days from when the restaurant was created

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'expired')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Set trial_ends_at for all existing restaurants that don't have it yet
UPDATE public.restaurants
SET trial_ends_at = created_at + INTERVAL '14 days'
WHERE trial_ends_at IS NULL;

-- Make trial_ends_at auto-populate on new restaurant inserts via a trigger
CREATE OR REPLACE FUNCTION public.set_trial_ends_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := NEW.created_at + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_trial_ends_at ON public.restaurants;
CREATE TRIGGER trg_set_trial_ends_at
  BEFORE INSERT ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.set_trial_ends_at();
