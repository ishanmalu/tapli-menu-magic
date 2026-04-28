import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Undo2, Redo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { FOOD_STYLE_FILTERS } from "@/components/menu/FoodStyleChips";
import { useUndoable } from "@/hooks/useUndoable";

interface Props {
  restaurant: Tables<"restaurants">;
  onUpdate: (r: Tables<"restaurants">) => void;
}

function buildEnabledChips(restaurant: Tables<"restaurants">): string[] {
  const fs = restaurant.filter_settings as any;
  return (fs?.foodStyleChips as string[] | undefined) ?? FOOD_STYLE_FILTERS.map((f) => f.id);
}

export function FoodStyleSettings({ restaurant, onUpdate }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { state: enabledChips, update, undo, redo, reset, canUndo, canRedo } =
    useUndoable<string[]>(buildEnabledChips(restaurant));

  const [saving, setSaving] = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);

  useEffect(() => {
    reset(buildEnabledChips(restaurant));
  }, [restaurant.id]);

  const toggleChip = (id: string) =>
    update((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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
            foodStyleChips: enabledChips,
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

  const labelMap: Record<string, string> = {
    "high-protein": t("highProtein"),
    "vegan":        t("tagVegan"),
    "vegetarian":   t("tagVegetarian"),
    "dairy-free":   t("dairyFree"),
    "gluten-free":  t("glutenFree"),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{t("foodStyleChipsTitle")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t("foodStyleChipsDesc")}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={!canUndo} title={t("undo")}>
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={!canRedo} title={t("redo")}>
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="divide-y">
          {FOOD_STYLE_FILTERS.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-7 text-center">{f.emoji}</span>
                <Label htmlFor={`chip-${f.id}`} className="font-medium cursor-pointer">
                  {labelMap[f.id] || f.label}
                </Label>
              </div>
              <Switch
                id={`chip-${f.id}`}
                checked={enabledChips.includes(f.id)}
                onCheckedChange={() => toggleChip(f.id)}
              />
            </div>
          ))}
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
