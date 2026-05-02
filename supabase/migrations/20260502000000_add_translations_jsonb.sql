-- Add translations JSONB column to menu_items
-- Stores extra language translations beyond FI (primary) and EN (_en columns)
-- Structure: { "sv": { "name": "...", "description": "...", "ingredients": ["..."] }, "de": { ... } }
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Add translations JSONB column to categories
-- Structure: { "sv": "Förrätter", "de": "Vorspeisen" }
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Index for faster JSONB lookups (GIN index covers all keys)
CREATE INDEX IF NOT EXISTS idx_menu_items_translations
  ON public.menu_items USING GIN (translations);

CREATE INDEX IF NOT EXISTS idx_categories_translations
  ON public.categories USING GIN (translations);
