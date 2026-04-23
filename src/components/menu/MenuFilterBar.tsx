import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MenuFilterBarProps {
  allergens: string[];
  dietaryOptions: string[];
  excludedAllergens: string[];
  setExcludedAllergens: (v: string[]) => void;
  selectedDietary: string[];
  setSelectedDietary: (v: string[]) => void;
  calorieRange: [number, number];
  setCalorieRange: (v: [number, number]) => void;
}

export function MenuFilterBar({
  allergens, dietaryOptions,
  excludedAllergens, setExcludedAllergens,
  selectedDietary, setSelectedDietary,
  calorieRange, setCalorieRange,
}: MenuFilterBarProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const hasFilters = excludedAllergens.length > 0 || selectedDietary.length > 0 || calorieRange[0] > 0 || calorieRange[1] < 2000;

  const toggleAllergen = (a: string) =>
    setExcludedAllergens(excludedAllergens.includes(a) ? excludedAllergens.filter((x) => x !== a) : [...excludedAllergens, a]);

  const toggleDietary = (d: string) =>
    setSelectedDietary(selectedDietary.includes(d) ? selectedDietary.filter((x) => x !== d) : [...selectedDietary, d]);

  const clearAll = () => {
    setExcludedAllergens([]);
    setSelectedDietary([]);
    setCalorieRange([0, 2000]);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="gap-2">
          <Filter className="h-4 w-4" />
          {t("filters")}
          {hasFilters && <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">{excludedAllergens.length + selectedDietary.length}</Badge>}
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" /> {t("clear")}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 rounded-lg border bg-card p-4 space-y-4 animate-in slide-in-from-top-2">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">{t("excludeAllergens")}</p>
            <div className="flex flex-wrap gap-2">
              {allergens.map((a) => (
                <Badge
                  key={a}
                  variant={excludedAllergens.includes(a) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleAllergen(a)}
                >
                  {a}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">{t("dietaryPreference")}</p>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((d) => (
                <Badge
                  key={d}
                  variant={selectedDietary.includes(d) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleDietary(d)}
                >
                  {d}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">{t("caloriesRange")}: {calorieRange[0]} – {calorieRange[1]} {t("kcal")}</p>
            <Slider
              min={0}
              max={2000}
              step={50}
              value={calorieRange}
              onValueChange={(v) => setCalorieRange(v as [number, number])}
              className="mt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}