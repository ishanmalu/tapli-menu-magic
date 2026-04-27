import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { FREE_FROM_ALLERGENS, DIETARY_LIFESTYLE_TAGS } from "@/constants/menuTags";

interface Props {
  restaurant: Tables<"restaurants">;
  onUpdate: (r: Tables<"restaurants">) => void;
}

export function TagSettings({ restaurant, onUpdate }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const allAllergens = [...FREE_FROM_ALLERGENS];
  const allDietary = [...DIETARY_LIFESTYLE_TAGS];

  const getActive = () => {
    const fs = restaurant.filter_settings as any;
    return {
      allergens: (fs?.activeAllergens as string[] | undefined) ?? allAllergens,
      dietary: (fs?.activeDietaryTags as string[] | undefined) ?? allDietary,
    };
  };

  const [activeAllergens, setActiveAllergens] = useState<string[]>(getActive().allergens);
  const [activeDietary, setActiveDietary] = useState<string[]>(getActive().dietary);
  const [saving, setSaving] = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);

  useEffect(() => {
    const a = getActive();
    setActiveAllergens(a.allergens);
    setActiveDietary(a.dietary);
  }, [restaurant.id]);

  const toggleAllergen = (a: string) =>
    setActiveAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const toggleDietary = (d: string) =>
    setActiveDietary((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = (restaurant.filter_settings as any) ?? {};
      const { data, error } = await supabase
        .from("restaurants")
        .update({
          filter_settings: {
            ...existing,
            activeAllergens,
            activeDietaryTags: activeDietary,
          },
        })
        .eq("id", restaurant.id)
        .select()
        .single();
      if (error) throw error;
      if (data) onUpdate(data);
      setSavedAnim(true);
      setTimeout(() => setSavedAnim(false), 2000);
      toast({ title: t("saved") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("tagSettingsTitle")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("tagSettingsDesc")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Free From */}
        <div>
          <p className="text-sm font-medium mb-2">{t("tagSettingsFreeFrom")}</p>
          <div className="flex flex-wrap gap-1.5">
            {allAllergens.map((a) => (
              <Badge
                key={a}
                variant={activeAllergens.includes(a) ? "default" : "outline"}
                className="cursor-pointer select-none text-xs transition-all"
                onClick={() => toggleAllergen(a)}
              >
                {tagLabels[a] || a}
              </Badge>
            ))}
          </div>
        </div>

        {/* Dietary & Lifestyle */}
        <div>
          <p className="text-sm font-medium mb-2">{t("tagSettingsDietary")}</p>
          <div className="flex flex-wrap gap-1.5">
            {allDietary.map((d) => (
              <Badge
                key={d}
                variant={activeDietary.includes(d) ? "default" : "outline"}
                className="cursor-pointer select-none text-xs transition-all"
                onClick={() => toggleDietary(d)}
              >
                {tagLabels[d] || d}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5 min-w-28">
            {savedAnim ? (
              <><Check className="h-4 w-4" /> {t("saved")}</>
            ) : saving ? t("saving") : t("saveChanges")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
