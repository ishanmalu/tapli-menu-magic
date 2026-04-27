// Shared types for restaurant filter_settings JSON column

/** A custom allergen or dietary tag defined by the restaurant manager. */
export interface CustomTag {
  id: string;       // stable slug stored in item.allergens / item.dietary_tags
  label: string;    // primary language display label
  labelEn?: string; // optional English label
  type: "allergen" | "dietary"; // which section it appears in
}

export type ChipMatchType =
  | "dietary_tag"
  | "allergen"
  | "protein_min"
  | "calories_min"
  | "calories_max"
  | "price_max";

export interface CustomChip {
  id: string;       // uuid
  emoji: string;
  label: string;    // primary language label
  labelEn?: string; // optional English label
  matchType: ChipMatchType;
  matchValue: string; // tag slug OR numeric string
}

export type SliderField = "calories" | "protein" | "price";

export interface SliderConfig {
  id: string;       // "calories" | "protein" | "budget" | uuid for custom
  label: string;
  unit: string;
  min: number;
  max: number;
  enabled: boolean;
  field: SliderField;
}

export interface MenuFilterSettings {
  bannerBlur?: number;
  // Built-in chip visibility
  foodStyleChips?: string[];
  // Custom chips added by manager
  customChips?: CustomChip[];
  // Which allergen/dietary tags are active for this restaurant
  activeAllergens?: string[];
  activeDietaryTags?: string[];
  // Custom tags added by the manager (stored + selectable on items)
  customTags?: CustomTag[];
  // New custom slider format
  sliders?: SliderConfig[];
  // Legacy format (kept for backwards compat)
  calories?: { enabled: boolean; min: number; max: number };
  protein?: { enabled: boolean; min: number; max: number };
  budget?: { enabled: boolean; min: number; max: number };
}

export const DEFAULT_SLIDERS: SliderConfig[] = [
  { id: "calories", label: "Calories", unit: "kcal", min: 0, max: 1500, enabled: true, field: "calories" },
  { id: "protein",  label: "Protein",  unit: "g",   min: 0, max: 100,  enabled: true, field: "protein"  },
  { id: "budget",   label: "Budget",   unit: "€",   min: 0, max: 50,   enabled: true, field: "price"    },
];

/** Normalise legacy or new filter_settings into a SliderConfig array. */
export function getSlidersFromSettings(fs: MenuFilterSettings | null | undefined): SliderConfig[] {
  if (!fs) return DEFAULT_SLIDERS;

  // New format
  if (fs.sliders && fs.sliders.length > 0) return fs.sliders;

  // Migrate legacy format
  const legacy: SliderConfig[] = [];
  if (fs.calories !== undefined) {
    legacy.push({ ...DEFAULT_SLIDERS[0], enabled: fs.calories.enabled, min: fs.calories.min, max: fs.calories.max });
  }
  if (fs.protein !== undefined) {
    legacy.push({ ...DEFAULT_SLIDERS[1], enabled: fs.protein.enabled, min: fs.protein.min, max: fs.protein.max });
  }
  if (fs.budget !== undefined) {
    legacy.push({ ...DEFAULT_SLIDERS[2], enabled: fs.budget.enabled, min: fs.budget.min, max: fs.budget.max });
  }
  return legacy.length > 0 ? legacy : DEFAULT_SLIDERS;
}

/** Returns the numeric item value for a given slider field. */
export function getItemFieldValue(
  item: { calories?: number | null; protein?: number | null; price?: unknown },
  field: SliderField
): number | null {
  if (field === "calories") return item.calories ?? null;
  if (field === "protein") return item.protein != null ? Number(item.protein) : null;
  if (field === "price") return Number(item.price);
  return null;
}

/** Returns true if the item matches the custom chip criteria. */
export function matchCustomChip(
  chip: CustomChip,
  item: { dietary_tags?: string[] | null; allergens?: string[] | null; protein?: unknown; calories?: number | null; price?: unknown }
): boolean {
  const val = parseFloat(chip.matchValue);
  switch (chip.matchType) {
    case "dietary_tag":   return item.dietary_tags?.includes(chip.matchValue) ?? false;
    case "allergen":      return item.allergens?.includes(chip.matchValue) ?? false;
    case "protein_min":   return item.protein != null && Number(item.protein) >= val;
    case "calories_min":  return item.calories != null && item.calories >= val;
    case "calories_max":  return item.calories != null && item.calories <= val;
    case "price_max":     return Number(item.price) <= val;
    default:              return false;
  }
}
