import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

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
    match: (item) => item.dietary_tags?.some((t) => ["high-carb", "carb-heavy", "pasta", "rice", "bread"].includes(t)) ?? false,
  },
  {
    id: "keto",
    label: "highFatKeto",
    emoji: "🥑",
    match: (item) => item.dietary_tags?.some((t) => ["keto", "low-carb"].includes(t)) ?? false,
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
    match: (item) => item.dietary_tags?.some((t) => ["vegan", "vegetarian", "plant-based"].includes(t)) ?? false,
  },
];

interface FoodStyleChipsProps {
  selected: string[];
  setSelected: (v: string[]) => void;
}

export function FoodStyleChips({ selected, setSelected }: FoodStyleChipsProps) {
  const { t } = useLanguage();
  const toggle = (id: string) =>
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const labelMap: Record<string, string> = {
    "high-protein": t("highProtein"),
    "high-carb": t("highCarb"),
    "keto": t("highFatKeto"),
    "low-calorie": t("lowCalorie"),
    "high-energy": t("highEnergy"),
    "plant-based": t("plantBased"),
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
      {FOOD_STYLE_FILTERS.map((f) => (
        <Badge
          key={f.id}
          variant={selected.includes(f.id) ? "default" : "outline"}
          className="cursor-pointer whitespace-nowrap px-3 py-1.5 text-sm flex-shrink-0"
          onClick={() => toggle(f.id)}
        >
          {f.emoji} {labelMap[f.id] || f.label}
        </Badge>
      ))}
    </div>
  );
}