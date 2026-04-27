import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Plus, Trash2, Undo2, Redo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type SliderConfig,
  type SliderField,
  getSlidersFromSettings,
} from "@/types/filterSettings";
import { useUndoable } from "@/hooks/useUndoable";

type Restaurant = Tables<"restaurants">;

const uid = () => Math.random().toString(36).slice(2, 10);

const BLANK_SLIDER: Omit<SliderConfig, "id"> = {
  label: "",
  unit: "",
  min: 0,
  max: 100,
  enabled: true,
  field: "calories",
};

interface Props {
  restaurant: Restaurant;
  onUpdate: (r: Restaurant) => void;
}

export function FilterSettingsEditor({ restaurant, onUpdate }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { state: sliders, update: setSliders, undo, redo, reset, canUndo, canRedo } =
    useUndoable<SliderConfig[]>(getSlidersFromSettings(restaurant.filter_settings as any));

  const [saving, setSaving] = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newSlider, setNewSlider] = useState<Omit<SliderConfig, "id">>(BLANK_SLIDER);

  useEffect(() => {
    reset(getSlidersFromSettings(restaurant.filter_settings as any));
  }, [restaurant.id]);

  const updateSlider = (id: string, patch: Partial<SliderConfig>) =>
    setSliders((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const removeSlider = (id: string) =>
    setSliders((prev) => prev.filter((s) => s.id !== id));

  const addSlider = () => {
    if (!newSlider.label.trim()) return;
    setSliders((prev) => [...prev, { ...newSlider, id: uid() }]);
    setNewSlider(BLANK_SLIDER);
    setAdding(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existing = (restaurant.filter_settings as any) ?? {};
      // Save in new sliders array format; remove legacy keys
      const { calories: _c, protein: _p, budget: _b, ...rest } = existing;
      const { data, error } = await supabase
        .from("restaurants")
        .update({ filter_settings: { ...rest, sliders } })
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

  const fieldOptions: { value: SliderField; label: string }[] = [
    { value: "calories", label: t("sliderFieldCalories") },
    { value: "protein",  label: t("sliderFieldProtein")  },
    { value: "price",    label: t("sliderFieldPrice")    },
  ];

  const absMaxFor = (field: SliderField) =>
    field === "calories" ? 3000 : field === "protein" ? 200 : 200;

  const stepFor = (field: SliderField) =>
    field === "calories" ? 50 : field === "protein" ? 5 : 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{t("customSlidersTitle")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{t("customSlidersDesc")}</p>
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
        {/* Existing sliders */}
        {sliders.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">{t("noItemsYet")}</p>
        )}

        {sliders.map((s) => (
          <div key={s.id} className="rounded-lg border bg-card p-3 space-y-3">
            {/* Top row: enabled + label + unit + field + delete */}
            <div className="flex items-center gap-2">
              <Switch
                checked={s.enabled}
                onCheckedChange={(v) => updateSlider(s.id, { enabled: v })}
                className="flex-shrink-0"
              />
              <Input
                value={s.label}
                onChange={(e) => updateSlider(s.id, { label: e.target.value })}
                placeholder={t("sliderLabelPlaceholder")}
                className="h-8 text-sm flex-1 min-w-0"
              />
              <Input
                value={s.unit}
                onChange={(e) => updateSlider(s.id, { unit: e.target.value })}
                placeholder={t("sliderUnitPlaceholder")}
                className="h-8 text-sm w-16 flex-shrink-0"
              />
              <Select
                value={s.field}
                onValueChange={(v) => updateSlider(s.id, { field: v as SliderField })}
              >
                <SelectTrigger className="h-8 text-sm w-28 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeSlider(s.id)}
                title={t("deleteSlider")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Min/Max range */}
            {s.enabled && (
              <div className="space-y-2 px-1">
                <Slider
                  min={0}
                  max={absMaxFor(s.field)}
                  step={stepFor(s.field)}
                  value={[s.min, s.max]}
                  onValueChange={([min, max]) => updateSlider(s.id, { min, max })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t("sliderMin")} ({s.unit || "—"})
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={s.max}
                      value={s.min}
                      onChange={(e) => updateSlider(s.id, { min: Number(e.target.value) })}
                      className="h-7 text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t("sliderMax")} ({s.unit || "—"})
                    </Label>
                    <Input
                      type="number"
                      min={s.min}
                      value={s.max}
                      onChange={(e) => updateSlider(s.id, { max: Number(e.target.value) })}
                      className="h-7 text-sm mt-0.5"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add slider form */}
        {adding ? (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={newSlider.label}
                onChange={(e) => setNewSlider((p) => ({ ...p, label: e.target.value }))}
                placeholder={t("sliderLabelPlaceholder")}
                className="h-8 text-sm flex-1"
              />
              <Input
                value={newSlider.unit}
                onChange={(e) => setNewSlider((p) => ({ ...p, unit: e.target.value }))}
                placeholder={t("sliderUnitPlaceholder")}
                className="h-8 text-sm w-16"
              />
              <Select
                value={newSlider.field}
                onValueChange={(v) => setNewSlider((p) => ({ ...p, field: v as SliderField }))}
              >
                <SelectTrigger className="h-8 text-sm w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{t("sliderMin")}</Label>
                <Input
                  type="number"
                  value={newSlider.min}
                  onChange={(e) => setNewSlider((p) => ({ ...p, min: Number(e.target.value) }))}
                  className="h-7 text-sm mt-0.5"
                />
              </div>
              <div>
                <Label className="text-xs">{t("sliderMax")}</Label>
                <Input
                  type="number"
                  value={newSlider.max}
                  onChange={(e) => setNewSlider((p) => ({ ...p, max: Number(e.target.value) }))}
                  className="h-7 text-sm mt-0.5"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setAdding(false); setNewSlider(BLANK_SLIDER); }}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={addSlider}
                disabled={!newSlider.label.trim()}
              >
                {t("addSlider")}
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
            <Plus className="h-4 w-4" /> {t("addSlider")}
          </Button>
        )}

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
