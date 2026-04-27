import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Trash2, Undo2, Redo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { FOOD_STYLE_FILTERS } from "@/components/menu/FoodStyleChips";
import type { CustomChip, ChipMatchType } from "@/types/filterSettings";
import { useUndoable } from "@/hooks/useUndoable";

const uid = () => Math.random().toString(36).slice(2, 10);

interface Props {
  restaurant: Tables<"restaurants">;
  onUpdate: (r: Tables<"restaurants">) => void;
}

const BLANK_CHIP: Omit<CustomChip, "id"> = {
  emoji: "",
  label: "",
  matchType: "dietary_tag",
  matchValue: "",
};

interface ChipState {
  enabledChips: string[];
  customChips: CustomChip[];
}

function buildChipState(restaurant: Tables<"restaurants">): ChipState {
  const fs = restaurant.filter_settings as any;
  const defaultChips = FOOD_STYLE_FILTERS.map((f) => f.id);
  return {
    enabledChips: (fs?.foodStyleChips as string[] | undefined) ?? defaultChips,
    customChips: (fs?.customChips as CustomChip[] | undefined) ?? [],
  };
}

export function FoodStyleSettings({ restaurant, onUpdate }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { state, update, undo, redo, reset, canUndo, canRedo } =
    useUndoable<ChipState>(buildChipState(restaurant));

  const [saving, setSaving] = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newChip, setNewChip] = useState<Omit<CustomChip, "id">>(BLANK_CHIP);

  useEffect(() => {
    reset(buildChipState(restaurant));
  }, [restaurant.id]);

  const toggleBuiltIn = (id: string) =>
    update((prev) => ({
      ...prev,
      enabledChips: prev.enabledChips.includes(id)
        ? prev.enabledChips.filter((x) => x !== id)
        : [...prev.enabledChips, id],
    }));

  const addChip = () => {
    if (!newChip.label.trim() || !newChip.matchValue.trim()) return;
    const chip: CustomChip = { ...newChip, id: uid(), emoji: newChip.emoji || "✨" };
    update((prev) => ({ ...prev, customChips: [...prev.customChips, chip] }));
    setNewChip(BLANK_CHIP);
    setAdding(false);
  };

  const removeCustomChip = (id: string) =>
    update((prev) => ({
      ...prev,
      customChips: prev.customChips.filter((c) => c.id !== id),
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = (restaurant.filter_settings as any) ?? {};
      const { data, error } = await supabase
        .from("restaurants")
        .update({
          filter_settings: {
            ...existing,
            foodStyleChips: state.enabledChips,
            customChips: state.customChips,
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
    "high-carb": t("highCarb"),
    keto: t("highFatKeto"),
    "low-calorie": t("lowCalorie"),
    "high-energy": t("highEnergy"),
    "plant-based": t("plantBased"),
  };

  const matchTypeOptions: { value: ChipMatchType; label: string }[] = [
    { value: "dietary_tag",   label: t("matchTypeDietaryTag") },
    { value: "allergen",      label: t("matchTypeAllergen") },
    { value: "protein_min",   label: t("matchTypeProteinMin") },
    { value: "calories_min",  label: t("matchTypeCaloriesMin") },
    { value: "calories_max",  label: t("matchTypeCaloriesMax") },
    { value: "price_max",     label: t("matchTypePriceMax") },
  ];

  const isTagMatch = newChip.matchType === "dietary_tag" || newChip.matchType === "allergen";

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
      <CardContent className="space-y-5">
        {/* Built-in chips */}
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
                checked={state.enabledChips.includes(f.id)}
                onCheckedChange={() => toggleBuiltIn(f.id)}
              />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-1">{t("customChipsSection")}</p>
          <p className="text-xs text-muted-foreground mb-3">{t("customChipsSectionDesc")}</p>

          {/* Existing custom chips */}
          {state.customChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {state.customChips.map((c) => (
                <Badge
                  key={c.id}
                  variant="secondary"
                  className="gap-1.5 pr-1.5 text-sm py-1"
                >
                  {c.emoji} {c.label}
                  <button
                    type="button"
                    onClick={() => removeCustomChip(c.id)}
                    className="ml-1 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add chip form */}
          {adding ? (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="grid grid-cols-[64px_1fr] gap-2">
                <div>
                  <Label className="text-xs">{t("chipEmoji")}</Label>
                  <Input
                    value={newChip.emoji}
                    onChange={(e) => setNewChip((p) => ({ ...p, emoji: e.target.value }))}
                    placeholder={t("chipEmojiPlaceholder")}
                    className="h-8 text-sm mt-1"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("chipLabel")}</Label>
                  <Input
                    value={newChip.label}
                    onChange={(e) => setNewChip((p) => ({ ...p, label: e.target.value }))}
                    placeholder={t("chipLabelPlaceholder")}
                    className="h-8 text-sm mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{t("chipMatchType")}</Label>
                  <Select
                    value={newChip.matchType}
                    onValueChange={(v) =>
                      setNewChip((p) => ({ ...p, matchType: v as ChipMatchType, matchValue: "" }))
                    }
                  >
                    <SelectTrigger className="h-8 text-sm mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {matchTypeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{t("chipMatchValue")}</Label>
                  <Input
                    value={newChip.matchValue}
                    onChange={(e) => setNewChip((p) => ({ ...p, matchValue: e.target.value }))}
                    placeholder={isTagMatch ? t("tagValuePlaceholder") : t("numericValuePlaceholder")}
                    className="h-8 text-sm mt-1"
                    type={isTagMatch ? "text" : "number"}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setAdding(false); setNewChip(BLANK_CHIP); }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={addChip}
                  disabled={!newChip.label.trim() || !newChip.matchValue.trim()}
                >
                  {t("saveChip")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4" /> {t("addCustomChip")}
            </Button>
          )}
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
