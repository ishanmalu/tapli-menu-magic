import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { FOOD_STYLE_FILTERS } from "@/components/menu/FoodStyleChips";

interface Props {
  restaurant: Tables<"restaurants">;
  onUpdate: (r: Tables<"restaurants">) => void;
}

export function FoodStyleSettings({ restaurant, onUpdate }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const defaultChips = FOOD_STYLE_FILTERS.map((f) => f.id);

  const getEnabled = () => {
    const fs = restaurant.filter_settings as any;
    return fs?.foodStyleChips ?? defaultChips;
  };

  const [enabledChips, setEnabledChips] = useState<string[]>(getEnabled);
  const [saving, setSaving] = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);

  useEffect(() => {
    setEnabledChips(getEnabled());
  }, [restaurant.id]);

  const toggle = (id: string) => {
    setEnabledChips((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = (restaurant.filter_settings as any) ?? {};
      const { data, error } = await supabase
        .from("restaurants")
        .update({ filter_settings: { ...existing, foodStyleChips: enabledChips } })
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

  const labelMap: Record<string, string> = {
    "high-protein": t("highProtein"),
    "high-carb": t("highCarb"),
    keto: t("highFatKeto"),
    "low-calorie": t("lowCalorie"),
    "high-energy": t("highEnergy"),
    "plant-based": t("plantBased"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("foodStyleChipsTitle")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("foodStyleChipsDesc")}</p>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="divide-y">
          {FOOD_STYLE_FILTERS.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-7 text-center">{f.emoji}</span>
                <Label
                  htmlFor={`chip-${f.id}`}
                  className="font-medium cursor-pointer"
                >
                  {labelMap[f.id] || f.label}
                </Label>
              </div>
              <Switch
                id={`chip-${f.id}`}
                checked={enabledChips.includes(f.id)}
                onCheckedChange={() => toggle(f.id)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="gap-1.5 min-w-28"
          >
            {savedAnim ? (
              <>
                <Check className="h-4 w-4" /> {t("saved")}
              </>
            ) : saving ? (
              t("saving")
            ) : (
              t("saveChanges")
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
