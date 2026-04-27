import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAllergenToggled, trackDietaryToggled, trackSliderChanged, trackFilterPanelToggled, trackFilterCleared } from "@/lib/posthog";

type SliderSettings = { enabled: boolean; min: number; max: number } | undefined | null;

interface MenuFilterBarProps {
  slug: string;
  allergens: string[];
  dietaryOptions: string[];
  excludedAllergens: string[];
  setExcludedAllergens: (v: string[]) => void;
  selectedDietary: string[];
  setSelectedDietary: (v: string[]) => void;
  calorieRange: [number, number];
  setCalorieRange: (v: [number, number]) => void;
  calorieSettings?: SliderSettings;
  proteinRange: [number, number];
  setProteinRange: (v: [number, number]) => void;
  proteinSettings?: SliderSettings;
  budgetRange: [number, number];
  setBudgetRange: (v: [number, number]) => void;
  budgetSettings?: SliderSettings;
}

export function MenuFilterBar({
  slug,
  allergens, dietaryOptions,
  excludedAllergens, setExcludedAllergens,
  selectedDietary, setSelectedDietary,
  calorieRange, setCalorieRange, calorieSettings,
  proteinRange, setProteinRange, proteinSettings,
  budgetRange, setBudgetRange, budgetSettings,
}: MenuFilterBarProps) {
  const { t } = useLanguage();

  const tagLabels: Record<string, string> = {
    "gluten-free": t("tagGlutenFree"), "dairy-free": t("tagDairyFree"),
    "egg-free": t("tagEggFree"), "fish-free": t("tagFishFree"),
    "peanut-free": t("tagPeanutFree"), "nut-free": t("tagNutFree"),
    "soy-free": t("tagSoyFree"), "shellfish-free": t("tagShellfishFree"),
    "sesame-free": t("tagSesameFree"), "celery-free": t("tagCeleryFree"),
    "mustard-free": t("tagMustardFree"), "sulphite-free": t("tagSulphiteFree"),
    "lupin-free": t("tagLupinFree"), "mollusc-free": t("tagMolluscrFree"),
    "vegan": t("tagVegan"), "vegetarian": t("tagVegetarian"),
    "lactose-free": t("tagLactoseFree"), "plant-based": t("tagPlantBased"),
    "low-carb": t("tagLowCarb"), "keto": t("tagKeto"),
    "high-protein": t("tagHighProtein"), "no-added-sugar": t("tagNoAddedSugar"),
    "low-calorie": t("tagLowCalorie"), "halal": t("tagHalal"),
    "kosher": t("tagKosher"), "no-pork": t("tagNoPork"),
    "no-alcohol": t("tagNoAlcohol"), "no-beef": t("tagNoBeef"),
  };

  const [open, setOpen] = useState(false);

  const handleOpenToggle = () => {
    const next = !open;
    setOpen(next);
    trackFilterPanelToggled({ open: next, slug });
  };

  const showCalories = calorieSettings?.enabled !== false;
  const showProtein  = proteinSettings?.enabled  !== false;
  const showBudget   = budgetSettings?.enabled   !== false;

  const calMin = calorieSettings?.min ?? 0;
  const calMax = calorieSettings?.max ?? 2000;
  const proMin = proteinSettings?.min ?? 0;
  const proMax = proteinSettings?.max ?? 100;
  const budMin = budgetSettings?.min ?? 0;
  const budMax = budgetSettings?.max ?? 50;

  const hasSliderFilter =
    (showCalories && (calorieRange[0] > calMin || calorieRange[1] < calMax)) ||
    (showProtein  && (proteinRange[0] > proMin  || proteinRange[1] < proMax)) ||
    (showBudget   && (budgetRange[0]  > budMin  || budgetRange[1]  < budMax));

  const hasFilters = excludedAllergens.length > 0 || selectedDietary.length > 0 || hasSliderFilter;

  const toggleAllergen = (a: string) => {
    const active = !excludedAllergens.includes(a);
    setExcludedAllergens(active ? [...excludedAllergens, a] : excludedAllergens.filter((x) => x !== a));
    trackAllergenToggled({ allergen: a, active, slug });
  };

  const toggleDietary = (d: string) => {
    const active = !selectedDietary.includes(d);
    setSelectedDietary(active ? [...selectedDietary, d] : selectedDietary.filter((x) => x !== d));
    trackDietaryToggled({ tag: d, active, slug });
  };

  const clearAll = () => {
    setExcludedAllergens([]);
    setSelectedDietary([]);
    setCalorieRange([calMin, calMax]);
    setProteinRange([proMin, proMax]);
    setBudgetRange([budMin, budMax]);
    trackFilterCleared({ slug });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleOpenToggle} className="gap-2">
          <Filter className="h-4 w-4" />
          {t("filters")}
          {hasFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              {excludedAllergens.length + selectedDietary.length + (hasSliderFilter ? 1 : 0)}
            </Badge>
          )}
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" /> {t("clear")}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 rounded-lg border bg-card p-4 space-y-5 animate-in slide-in-from-top-2">

          {/* Free From */}
          {allergens.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">{t("freeFrom")}</p>
              <div className="flex flex-wrap gap-2">
                {allergens.map((a) => (
                  <Badge key={a} variant={excludedAllergens.includes(a) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleAllergen(a)}>
                    {tagLabels[a] || a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dietary & Lifestyle */}
          {dietaryOptions.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">{t("dietaryAndLifestyle")}</p>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((d) => (
                  <Badge key={d} variant={selectedDietary.includes(d) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleDietary(d)}>
                    {tagLabels[d] || d}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Calories slider */}
          {showCalories && (
            <div>
              <p className="text-sm font-medium mb-2">
                🔥 {t("sliderCalories")}: <span className="text-primary">{calorieRange[0]} – {calorieRange[1]} {t("kcal")}</span>
              </p>
              <Slider min={calMin} max={calMax} step={10} value={calorieRange}
                onValueChange={(v) => setCalorieRange(v as [number, number])}
                onValueCommit={(v) => trackSliderChanged({ slider: "calories", min: v[0], max: v[1], slug })} />
            </div>
          )}

          {/* Protein slider */}
          {showProtein && (
            <div>
              <p className="text-sm font-medium mb-2">
                💪 {t("sliderProtein")}: <span className="text-primary">{proteinRange[0]} – {proteinRange[1]}g</span>
              </p>
              <Slider min={proMin} max={proMax} step={1} value={proteinRange}
                onValueChange={(v) => setProteinRange(v as [number, number])}
                onValueCommit={(v) => trackSliderChanged({ slider: "protein", min: v[0], max: v[1], slug })} />
            </div>
          )}

          {/* Budget slider */}
          {showBudget && (
            <div>
              <p className="text-sm font-medium mb-2">
                💰 {t("sliderBudget")}: <span className="text-primary">€{budgetRange[0]} – €{budgetRange[1]}</span>
              </p>
              <Slider min={budMin} max={budMax} step={1} value={budgetRange}
                onValueChange={(v) => setBudgetRange(v as [number, number])}
                onValueCommit={(v) => trackSliderChanged({ slider: "budget", min: v[0], max: v[1], slug })} />
            </div>
          )}

        </div>
      )}
    </div>
  );
}
