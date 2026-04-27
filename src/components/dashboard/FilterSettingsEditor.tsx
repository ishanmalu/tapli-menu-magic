import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, FilterSlider } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

type Restaurant = Tables<"restaurants">;
type Settings = { calories: FilterSlider; protein: FilterSlider; budget: FilterSlider };

const DEFAULTS: Settings = {
  calories: { enabled: true, min: 0, max: 1500 },
  protein:  { enabled: true, min: 0, max: 100 },
  budget:   { enabled: true, min: 0, max: 50 },
};

interface Props {
  restaurant: Restaurant;
  onUpdate: (r: Restaurant) => void;
}

export function FilterSettingsEditor({ restaurant, onUpdate }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [settings, setSettings] = useState<Settings>(
    (restaurant.filter_settings as Settings | null) ?? DEFAULTS
  );
  const [saving, setSaving]       = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);

  useEffect(() => {
    setSettings((restaurant.filter_settings as Settings | null) ?? DEFAULTS);
  }, [restaurant.id]);

  const update = (
    key: keyof Settings,
    field: keyof FilterSlider,
    value: boolean | number
  ) =>
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .update({ filter_settings: settings as any })
        .eq("id", restaurant.id)
        .select()
        .single();
      if (error) throw error;
      if (data) onUpdate(data);
      setSavedAnim(true);
      setTimeout(() => setSavedAnim(false), 2000);
      toast({ title: t("saved"), description: t("changesSaved") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sliders: { key: keyof Settings; label: string; unit: string; absMax: number }[] = [
    { key: "calories", label: t("sliderCalories"), unit: "kcal", absMax: 3000 },
    { key: "protein",  label: t("sliderProtein"),  unit: "g",    absMax: 200  },
    { key: "budget",   label: t("sliderBudget"),   unit: "€",    absMax: 200  },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("filterSliders")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("filterSlidersDesc")}</p>
        <p className="text-xs text-muted-foreground/70 italic mt-1">{t("dynamicFilterNote")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {sliders.map(({ key, label, unit, absMax }) => {
          const s = settings[key];
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">{label}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t("sliderEnabled")}</span>
                  <Switch
                    checked={s.enabled}
                    onCheckedChange={v => update(key, "enabled", v)}
                  />
                </div>
              </div>
              {s.enabled && (
                <div className="space-y-3">
                  <Slider
                    min={0}
                    max={absMax}
                    step={key === "calories" ? 50 : key === "budget" ? 1 : 5}
                    value={[s.min, s.max]}
                    onValueChange={([min, max]) => {
                      update(key, "min", min);
                      update(key, "max", max);
                    }}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("sliderMin")} ({unit})</Label>
                      <Input
                        type="number"
                        min={0}
                        max={s.max}
                        value={s.min}
                        onChange={e => update(key, "min", Number(e.target.value))}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("sliderMax")} ({unit})</Label>
                      <Input
                        type="number"
                        min={s.min}
                        value={s.max}
                        onChange={e => update(key, "max", Number(e.target.value))}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

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
