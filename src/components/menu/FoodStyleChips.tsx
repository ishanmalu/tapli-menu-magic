import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackFoodStyleToggled } from "@/lib/posthog";

export interface FoodStyleFilter {
  id: string;
  label: string;
  emoji: string;
  match: (item: { calories?: number | null; protein?: number | null; dietary_tags?: string[] | null; allergens?: string[] | null }) => boolean;
}

// label field is an internal fallback only — displayed labels come from labelMap via t()
export const FOOD_STYLE_FILTERS: FoodStyleFilter[] = [
  {
    id: "high-protein",
    label: "highProtein",
    emoji: "🔥",
    match: (item) => item.protein != null && Number(item.protein) >= 25,
  },
  {
    id: "low-calorie",
    label: "lowCalorie",
    emoji: "🥗",
    match: (item) => item.calories != null && item.calories <= 300,
  },
  {
    id: "high-energy",
    label: "highEnergy",
    emoji: "⚡",
    match: (item) => item.calories != null && item.calories >= 600,
  },
  {
    id: "plant-based",
    label: "plantBased",
    emoji: "🌱",
    match: (item) =>
      item.dietary_tags?.some((t) =>
        ["vegan", "vegetarian", "plant-based"].includes(t)
      ) ?? false,
  },
  {
    id: "meat-free",
    label: "meatFree",
    emoji: "🥩",
    match: (item) =>
      item.dietary_tags?.some((t) =>
        ["vegan", "vegetarian", "plant-based", "no-pork", "no-beef"].includes(t)
      ) ?? false,
  },
  {
    id: "dairy-free",
    label: "dairyFree",
    emoji: "🧀",
    match: (item) =>
      item.allergens?.includes("dairy-free") ?? false,
  },
  {
    id: "gluten-free",
    label: "glutenFree",
    emoji: "🌾",
    match: (item) =>
      item.allergens?.includes("gluten-free") ?? false,
  },
  {
    id: "low-carb",
    label: "lowCarb",
    emoji: "💊",
    match: (item) =>
      item.dietary_tags?.some((t) => ["low-carb", "keto"].includes(t)) ?? false,
  },
];

interface FoodStyleChipsProps {
  selected: string[];
  setSelected: (v: string[]) => void;
  slug: string;
  /** IDs of built-in chips the restaurant has enabled. Undefined = show all. */
  enabledIds?: string[];
}

export function FoodStyleChips({
  selected,
  setSelected,
  slug,
  enabledIds,
}: FoodStyleChipsProps) {
  const { t } = useLanguage();

  const toggle = (id: string) => {
    const active = !selected.includes(id);
    setSelected(active ? [...selected, id] : selected.filter((x) => x !== id));
    trackFoodStyleToggled({ style: id, active, slug });
  };

  const labelMap: Record<string, string> = {
    "high-protein": t("highProtein"),
    "low-calorie":  t("lowCalorie"),
    "high-energy":  t("highEnergy"),
    "plant-based":  t("plantBased"),
    "meat-free":    t("meatFree"),
    "dairy-free":   t("dairyFree"),
    "gluten-free":  t("glutenFree"),
    "low-carb":     t("lowCarb"),
  };

  const visibleChips = enabledIds
    ? FOOD_STYLE_FILTERS.filter((f) => enabledIds.includes(f.id))
    : FOOD_STYLE_FILTERS;

  if (!visibleChips.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {visibleChips.map((f) => (
        <Badge
          key={f.id}
          variant={selected.includes(f.id) ? "default" : "outline"}
          className="cursor-pointer px-3 py-1.5 text-sm"
          onClick={() => toggle(f.id)}
        >
          {f.emoji} {labelMap[f.id] || f.label}
        </Badge>
      ))}
    </div>
  );
}
