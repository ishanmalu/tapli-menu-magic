import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackFoodStyleToggled } from "@/lib/posthog";

export interface FoodStyleFilter {
  id: string;
  emoji: string;
  match: (item: {
    calories?: number | null;
    protein?: number | null;
    dietary_tags?: string[] | null;
    allergens?: string[] | null;
  }) => boolean;
}

export const FOOD_STYLE_FILTERS: FoodStyleFilter[] = [
  {
    id: "high-protein",
    emoji: "🔥",
    match: (item) => item.protein != null && Number(item.protein) >= 25,
  },
  {
    id: "vegan",
    emoji: "🌱",
    match: (item) => item.dietary_tags?.includes("vegan") ?? false,
  },
  {
    id: "vegetarian",
    emoji: "🥦",
    // Vegetarian includes vegan items — vegan ⊂ vegetarian
    match: (item) =>
      item.dietary_tags?.some((t) => ["vegetarian", "vegan"].includes(t)) ?? false,
  },
  {
    id: "low-calorie",
    emoji: "🥗",
    match: (item) => item.calories != null && item.calories <= 300,
  },
  {
    id: "red-meat-free",
    emoji: "🥩",
    // Matches items explicitly free from red meat, or vegetarian/vegan (implicitly red meat free)
    match: (item) =>
      item.dietary_tags?.some((t) =>
        ["red-meat-free", "no-beef", "no-pork", "vegetarian", "vegan"].includes(t)
      ) ?? false,
  },
  {
    id: "dairy-free",
    emoji: "🧀",
    match: (item) => item.allergens?.includes("dairy-free") ?? false,
  },
  {
    id: "gluten-free",
    emoji: "🌾",
    match: (item) => item.allergens?.includes("gluten-free") ?? false,
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
    "high-protein":  t("highProtein"),
    "vegan":         t("tagVegan"),
    "vegetarian":    t("tagVegetarian"),
    "low-calorie":   t("lowCalorie"),
    "red-meat-free": t("redMeatFree"),
    "dairy-free":    t("dairyFree"),
    "gluten-free":   t("glutenFree"),
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
          {f.emoji} {labelMap[f.id] ?? f.id}
        </Badge>
      ))}
    </div>
  );
}
