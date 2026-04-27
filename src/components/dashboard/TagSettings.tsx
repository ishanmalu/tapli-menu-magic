import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Plus, Trash2, Undo2, Redo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { FREE_FROM_ALLERGENS, DIETARY_LIFESTYLE_TAGS } from "@/constants/menuTags";
import type { CustomTag } from "@/types/filterSettings";
import { useUndoable } from "@/hooks/useUndoable";

interface TagState {
  activeAllergens: string[];
  activeDietary: string[];
  customTags: CustomTag[];
}

interface Props {
  restaurant: Tables<"restaurants">;
  onUpdate: (r: Tables<"restaurants">) => void;
}

const uid = () => `ct-${Math.random().toString(36).slice(2, 9)}`;

const allAllergens = [...FREE_FROM_ALLERGENS];
const allDietary = [...DIETARY_LIFESTYLE_TAGS];

function buildInitial(restaurant: Tables<"restaurants">): TagState {
  const fs = restaurant.filter_settings as any;
  return {
    activeAllergens: (fs?.activeAllergens as string[] | undefined) ?? allAllergens,
    activeDietary: (fs?.activeDietaryTags as string[] | undefined) ?? allDietary,
    customTags: (fs?.customTags as CustomTag[] | undefined) ?? [],
  };
}

export function TagSettings({ restaurant, onUpdate }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { state, update, undo, redo, reset, canUndo, canRedo } = useUndoable<TagState>(
    buildInitial(restaurant)
  );

  const [saving, setSaving] = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);

  // New custom tag form
  const [addingTag, setAddingTag] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<"allergen" | "dietary">("allergen");

  // Reset when switching restaurants
  useEffect(() => {
    reset(buildInitial(restaurant));
  }, [restaurant.id]);

  const toggleAllergen = (a: string) =>
    update((prev) => ({
      ...prev,
      activeAllergens: prev.activeAllergens.includes(a)
        ? prev.activeAllergens.filter((x) => x !== a)
        : [...prev.activeAllergens, a],
    }));

  const toggleDietary = (d: string) =>
    update((prev) => ({
      ...prev,
      activeDietary: prev.activeDietary.includes(d)
        ? prev.activeDietary.filter((x) => x !== d)
        : [...prev.activeDietary, d],
    }));

  const addCustomTag = () => {
    const label = newLabel.trim();
    if (!label) return;
    const id = uid();
    const tag: CustomTag = { id, label, type: newType };
    update((prev) => ({
      ...prev,
      customTags: [...prev.customTags, tag],
      // Auto-enable newly created custom tag
      activeAllergens:
        newType === "allergen"
          ? [...prev.activeAllergens, id]
          : prev.activeAllergens,
      activeDietary:
        newType === "dietary"
          ? [...prev.activeDietary, id]
          : prev.activeDietary,
    }));
    setNewLabel("");
    setAddingTag(false);
  };

  const removeCustomTag = (id: string) =>
    update((prev) => ({
      ...prev,
      customTags: prev.customTags.filter((t) => t.id !== id),
      activeAllergens: prev.activeAllergens.filter((x) => x !== id),
      activeDietary: prev.activeDietary.filter((x) => x !== id),
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
            activeAllergens: state.activeAllergens,
            activeDietaryTags: state.activeDietary,
            customTags: state.customTags,
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

  const customAllergenTags = state.customTags.filter((t) => t.type === "allergen");
  const customDietaryTags = state.customTags.filter((t) => t.type === "dietary");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{t("tagSettingsTitle")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t("tagSettingsDesc")}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={undo} disabled={!canUndo} title={t("undo")}
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={redo} disabled={!canRedo} title={t("redo")}
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Free From */}
        <div>
          <p className="text-sm font-medium mb-2">{t("tagSettingsFreeFrom")}</p>
          <div className="flex flex-wrap gap-1.5">
            {allAllergens.map((a) => (
              <Badge
                key={a}
                variant={state.activeAllergens.includes(a) ? "default" : "outline"}
                className="cursor-pointer select-none text-xs transition-all"
                onClick={() => toggleAllergen(a)}
              >
                {tagLabels[a] || a}
              </Badge>
            ))}
            {/* Custom allergen tags */}
            {customAllergenTags.map((ct) => (
              <div key={ct.id} className="flex items-center gap-0.5">
                <Badge
                  variant={state.activeAllergens.includes(ct.id) ? "default" : "outline"}
                  className="cursor-pointer select-none text-xs transition-all pr-1"
                  onClick={() => toggleAllergen(ct.id)}
                >
                  {ct.label}
                </Badge>
                <button
                  type="button"
                  onClick={() => removeCustomTag(ct.id)}
                  className="rounded-full p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title={t("deleteChip")}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
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
                variant={state.activeDietary.includes(d) ? "default" : "outline"}
                className="cursor-pointer select-none text-xs transition-all"
                onClick={() => toggleDietary(d)}
              >
                {tagLabels[d] || d}
              </Badge>
            ))}
            {/* Custom dietary tags */}
            {customDietaryTags.map((ct) => (
              <div key={ct.id} className="flex items-center gap-0.5">
                <Badge
                  variant={state.activeDietary.includes(ct.id) ? "default" : "outline"}
                  className="cursor-pointer select-none text-xs transition-all pr-1"
                  onClick={() => toggleDietary(ct.id)}
                >
                  {ct.label}
                </Badge>
                <button
                  type="button"
                  onClick={() => removeCustomTag(ct.id)}
                  className="rounded-full p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title={t("deleteChip")}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add custom tag */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-1">{t("customTagsSection")}</p>
          {addingTag ? (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="grid grid-cols-[1fr_140px] gap-2">
                <div>
                  <Label className="text-xs">{t("customTagLabel")}</Label>
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder={t("customTagLabelPlaceholder")}
                    className="h-8 text-sm mt-1"
                    onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("customTagType")}</Label>
                  <Select value={newType} onValueChange={(v) => setNewType(v as "allergen" | "dietary")}>
                    <SelectTrigger className="h-8 text-sm mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allergen">{t("customTagTypeFreeFrom")}</SelectItem>
                      <SelectItem value="dietary">{t("customTagTypeDietary")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button" variant="ghost" size="sm"
                  onClick={() => { setAddingTag(false); setNewLabel(""); }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button" size="sm"
                  onClick={addCustomTag}
                  disabled={!newLabel.trim()}
                >
                  {t("saveTag")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button" variant="outline" size="sm"
              className="gap-1.5"
              onClick={() => setAddingTag(true)}
            >
              <Plus className="h-4 w-4" /> {t("addCustomTag")}
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
