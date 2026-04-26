import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Check, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/translate";

type Restaurant = Tables<"restaurants">;
type HoursRow = { days: string; hours: string };

interface Props {
  restaurant: Restaurant;
  onUpdate: (r: Restaurant) => void;
}

export function RestaurantInfoEditor({ restaurant, onUpdate }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [name, setName]           = useState(restaurant.name);
  const [slogan, setSlogan]       = useState(restaurant.slogan ?? "");
  const [description, setDesc]    = useState(restaurant.description ?? "");
  const [descEn, setDescEn]       = useState((restaurant as any).description_en ?? "");
  const [hours, setHours]         = useState<HoursRow[]>(
    (restaurant.opening_hours as HoursRow[] | null) ?? []
  );
  const [saving, setSaving]         = useState(false);
  const [savedAnim, setSavedAnim]   = useState(false);
  const [translatingDesc, setTranslatingDesc] = useState(false);

  const autoTranslateDesc = async (from: "fi" | "en") => {
    const source = from === "fi" ? description : descEn;
    if (!source.trim()) return;
    setTranslatingDesc(true);
    try {
      const result = await translate(source, from, from === "fi" ? "en" : "fi");
      if (from === "fi") setDescEn(result); else setDesc(result);
    } catch {
      toast({ title: t("translateError"), variant: "destructive" });
    } finally {
      setTranslatingDesc(false);
    }
  };

  // Keep local state in sync if parent refreshes restaurant
  useEffect(() => {
    setName(restaurant.name);
    setSlogan(restaurant.slogan ?? "");
    setDesc(restaurant.description ?? "");
    setDescEn((restaurant as any).description_en ?? "");
    setHours((restaurant.opening_hours as HoursRow[] | null) ?? []);
  }, [restaurant.id]);

  const addRow    = () => setHours([...hours, { days: "", hours: "" }]);
  const removeRow = (i: number) => setHours(hours.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof HoursRow, val: string) =>
    setHours(hours.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .update({
          name:             name.trim(),
          slogan:           slogan.trim() || null,
          description:      description.trim() || null,
          description_en:   descEn.trim() || null,
          opening_hours:    hours.filter(r => r.days.trim() || r.hours.trim()),
        })
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("restaurantInfo")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Name */}
        <div>
          <Label>{t("editName")}</Label>
          <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
        </div>

        {/* Slogan */}
        <div>
          <Label>{t("sloganLabel")}</Label>
          <Input
            value={slogan}
            onChange={e => setSlogan(e.target.value)}
            placeholder={t("sloganPlaceholder")}
            className="mt-1"
          />
        </div>

        {/* Description FI + EN with translate */}
        <div className="space-y-1.5">
          <Label>{t("descriptionLabel")} <span className="text-muted-foreground font-normal text-xs">(FI)</span></Label>
          <Textarea value={description} onChange={e => setDesc(e.target.value)} placeholder={t("descriptionPlaceholder")} rows={2} className="resize-none" />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={translatingDesc || !description.trim()}
              onClick={() => autoTranslateDesc("fi")}
              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Languages className="h-3 w-3" />
              {translatingDesc ? t("translating") : t("translateToEn")}
            </button>
            {descEn && (
              <button
                type="button"
                disabled={translatingDesc || !descEn.trim()}
                onClick={() => autoTranslateDesc("en")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Languages className="h-3 w-3" />
                {t("translateToFi")}
              </button>
            )}
          </div>
          <Textarea value={descEn} onChange={e => setDescEn(e.target.value)} placeholder={t("englishTranslation")} rows={2} className="resize-none" />
        </div>

        {/* Opening hours */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>{t("openingHoursLabel")}</Label>
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> {t("addRow")}
            </button>
          </div>

          {hours.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              {t("addRow")} →
            </p>
          ) : (
            <div className="space-y-2">
              {hours.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={row.days}
                    onChange={e => updateRow(i, "days", e.target.value)}
                    placeholder={t("daysPlaceholder")}
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    value={row.hours}
                    onChange={e => updateRow(i, "hours", e.target.value)}
                    placeholder={t("hoursPlaceholder")}
                    className="flex-1 h-8 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} disabled={saving || !name.trim()} size="sm" className="gap-1.5 min-w-28">
            {savedAnim ? (
              <><Check className="h-4 w-4" /> {t("saved")}</>
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
