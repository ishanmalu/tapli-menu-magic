import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackFoodStyleToggled } from "@/lib/posthog";
import type { CustomChip } from "@/types/filterSettings";

export interface FoodStyleFilter {
  id: string;
  label: string;
  emoji: string;
  match: (item: { calories?: number | null; protein?: number | null; dietary_tags?: string[] | null }) => boolean;
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
    id: "high-carb",
    label: "highCarb",
    emoji: "🍞",
    match: (item) =>
      item.dietary_tags?.some((t) =>
        ["high-carb", "carb-heavy", "pasta", "rice", "bread"].includes(t)
      ) ?? false,
  },
  {
    id: "keto",
    label: "highFatKeto",
    emoji: "🥑",
    match: (item) =>
      item.dietary_tags?.some((t) => ["keto", "low-carb"].includes(t)) ?? false,
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
];

interface FoodStyleChipsProps {
  selected: string[];
  setSelected: (v: string[]) => void;
  slug: string;
  /** IDs of built-in chips the restaurant has enabled. Undefined = show all. */
  enabledIds?: string[];
  /** Custom chips defined by the restaurant manager. */
  customChips?: CustomChip[];
}

export function FoodStyleChips({
  selected,
  setSelected,
  slug,
  enabledIds,
  customChips = [],
}: FoodStyleChipsProps) {
  const { t } = useLanguage();

  const toggle = (id: string) => {
    const active = !selected.includes(id);
    setSelected(active ? [...selected, id] : selected.filter((x) => x !== id));
    trackFoodStyleToggled({ style: id, active, slug });
  };

  const labelMap: Record<string, string> = {
    "high-protein": t("highProtein"),
    "high-carb":    t("highCarb"),
    keto:           t("highFatKeto"),
    "low-calorie":  t("lowCalorie"),
    "high-energy":  t("highEnergy"),
    "plant-based":  t("plantBased"),
  };

  // Filter built-in chips by enabledIds
  const visibleBuiltIn = enabledIds
    ? FOOD_STYLE_FILTERS.filter((f) => enabledIds.includes(f.id))
    : FOOD_STYLE_FILTERS;

  const hasAnything = visibleBuiltIn.length > 0 || customChips.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {/* Built-in chips */}
      {visibleBuiltIn.map((f) => (
        <Badge
          key={f.id}
          variant={selected.includes(f.id) ? "default" : "outline"}
          className="cursor-pointer px-3 py-1.5 text-sm"
          onClick={() => toggle(f.id)}
        >
          {f.emoji} {labelMap[f.id] || f.label}
        </Badge>
      ))}

      {/* Custom chips */}
      {customChips.map((c) => (
        <Badge
          key={c.id}
          variant={selected.includes(c.id) ? "default" : "outline"}
          className="cursor-pointer px-3 py-1.5 text-sm"
          onClick={() => toggle(c.id)}
        >
          {c.emoji} {c.label}
        </Badge>
      ))}
    </div>
  );
}
