import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackAllergenToggled, trackDietaryToggled, trackSliderChanged, trackFilterPanelToggled, trackFilterCleared } from "@/lib/posthog";
import type { SliderConfig } from "@/types/filterSettings";

interface MenuFilterBarProps {
  slug: string;
  allergens: string[];
  dietaryOptions: string[];
  excludedAllergens: string[];
  setExcludedAllergens: (v: string[]) => void;
  selectedDietary: string[];
  setSelectedDietary: (v: string[]) => void;
  sliders: SliderConfig[];
  sliderValues: Record<string, [number, number]>;
  setSliderValues: (v: Record<string, [number, number]>) => void;
  /** Custom tag labels for manager-defined tags */
  extraTagLabels?: Record<string, string>;
}

export function MenuFilterBar({
  slug,
  allergens,
  dietaryOptions,
  excludedAllergens,
  setExcludedAllergens,
  selectedDietary,
  setSelectedDietary,
  sliders,
  sliderValues,
  setSliderValues,
  extraTagLabels = {},
}: MenuFilterBarProps) {
  const { t } = useLanguage();

  const tagLabels: Record<string, string> = {
    ...extraTagLabels,
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

  const enabledSliders = sliders.filter((s) => s.enabled);

  const hasSliderFilter = enabledSliders.some((s) => {
    const range = sliderValues[s.id];
    if (!range) return false;
    return range[0] > s.min || range[1] < s.max;
  });

  const hasFilters =
    excludedAllergens.length > 0 || selectedDietary.length > 0 || hasSliderFilter;

  const activeCount =
    excludedAllergens.length + selectedDietary.length + (hasSliderFilter ? 1 : 0);

  const toggleAllergen = (a: string) => {
    const active = !excludedAllergens.includes(a);
    setExcludedAllergens(
      active ? [...excludedAllergens, a] : excludedAllergens.filter((x) => x !== a)
    );
    trackAllergenToggled({ allergen: a, active, slug });
  };

  const toggleDietary = (d: string) => {
    const active = !selectedDietary.includes(d);
    setSelectedDietary(
      active ? [...selectedDietary, d] : selectedDietary.filter((x) => x !== d)
    );
    trackDietaryToggled({ tag: d, active, slug });
  };

  const clearAll = () => {
    setExcludedAllergens([]);
    setSelectedDietary([]);
    // Reset all slider values to their defaults
    const reset: Record<string, [number, number]> = {};
    sliders.forEach((s) => { reset[s.id] = [s.min, s.max]; });
    setSliderValues(reset);
    trackFilterCleared({ slug });
  };

  const updateSlider = (id: string, value: [number, number]) => {
    setSliderValues({ ...sliderValues, [id]: value });
  };

  const showFilters =
    allergens.length > 0 || dietaryOptions.length > 0 || enabledSliders.length > 0;

  if (!showFilters) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenToggle}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {t("filters")}
          {hasFilters && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="gap-1 text-muted-foreground"
          >
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
                  <Badge
                    key={a}
                    variant={excludedAllergens.includes(a) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleAllergen(a)}
                  >
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
                  <Badge
                    key={d}
                    variant={selectedDietary.includes(d) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDietary(d)}
                  >
                    {tagLabels[d] || d}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic sliders */}
          {enabledSliders.map((s) => {
            const range = sliderValues[s.id] ?? [s.min, s.max];
            return (
              <div key={s.id}>
                <p className="text-sm font-medium mb-2">
                  {s.label}
                  {s.unit && (
                    <span className="text-muted-foreground font-normal"> ({s.unit})</span>
                  )}
                  {": "}
                  <span className="text-primary">
                    {range[0]} – {range[1]}
                    {s.unit ? ` ${s.unit}` : ""}
                  </span>
                </p>
                <Slider
                  min={s.min}
                  max={s.max}
                  step={s.field === "calories" ? 10 : s.field === "price" ? 1 : 1}
                  value={range}
                  onValueChange={(v) => updateSlider(s.id, v as [number, number])}
                  onValueCommit={(v) =>
                    trackSliderChanged({ slider: s.id as "budget" | "calories" | "protein", min: v[0], max: v[1], slug })
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
