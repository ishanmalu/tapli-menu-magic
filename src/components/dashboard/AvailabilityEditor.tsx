import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AvailabilitySchedule, AvailabilitySlot } from "@/integrations/supabase/types";

interface Props {
  value: AvailabilitySchedule | null;
  onChange: (v: AvailabilitySchedule | null) => void;
}

const PRESETS: AvailabilitySlot[] = [
  { label: "Breakfast", from: "07:00", to: "11:00" },
  { label: "Lunch",     from: "11:00", to: "15:00" },
  { label: "Dinner",    from: "17:00", to: "23:00" },
];

const PRESET_ICONS: Record<string, string> = {
  Breakfast: "🌅",
  Lunch: "☀️",
  Dinner: "🌙",
};

export function AvailabilityEditor({ value, onChange }: Props) {
  const { t } = useLanguage();

  const enabled = value?.enabled ?? false;
  const slots   = value?.slots ?? [];

  const setEnabled = (on: boolean) => {
    if (!on) { onChange(null); return; }
    onChange({ enabled: true, slots: [] });
  };

  const addPreset = (preset: AvailabilitySlot) => {
    if (slots.some(s => s.label === preset.label)) return;
    onChange({ enabled: true, slots: [...slots, { ...preset }] });
  };

  const addCustom = () => {
    onChange({ enabled: true, slots: [...slots, { label: "Custom", from: "09:00", to: "17:00" }] });
  };

  const updateSlot = (i: number, field: keyof AvailabilitySlot, val: string) => {
    const next = slots.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    onChange({ enabled: true, slots: next });
  };

  const removeSlot = (i: number) => {
    const next = slots.filter((_, idx) => idx !== i);
    onChange({ enabled: true, slots: next });
  };

  const presetLabel = (label: string) => {
    if (label === "Breakfast") return t("presetBreakfast");
    if (label === "Lunch")     return t("presetLunch");
    if (label === "Dinner")    return t("presetDinner");
    return label;
  };

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="font-medium">{t("availability")}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {enabled ? t("timeBased") : t("alwaysAvailable")}
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <div className="space-y-3 pl-1">
          {/* Preset chips */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => {
              const active = slots.some(s => s.label === p.label);
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => active ? removeSlot(slots.findIndex(s => s.label === p.label)) : addPreset(p)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors
                    ${active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground hover:border-primary"}`}
                >
                  {PRESET_ICONS[p.label]} {presetLabel(p.label)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={addCustom}
              className="flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" /> {t("addSlot")}
            </button>
          </div>

          {/* Slot editors */}
          {slots.length > 0 && (
            <div className="space-y-2">
              {slots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                  <span className="text-sm w-5 flex-shrink-0">
                    {PRESET_ICONS[slot.label] ?? "⏰"}
                  </span>
                  <Input
                    value={slot.label}
                    onChange={e => updateSlot(i, "label", e.target.value)}
                    className="h-7 text-xs flex-1 min-w-0"
                  />
                  <span className="text-xs text-muted-foreground flex-shrink-0">{t("slotFrom")}</span>
                  <Input
                    type="time"
                    value={slot.from}
                    onChange={e => updateSlot(i, "from", e.target.value)}
                    className="h-7 text-xs w-24 flex-shrink-0"
                  />
                  <span className="text-xs text-muted-foreground flex-shrink-0">{t("slotTo")}</span>
                  <Input
                    type="time"
                    value={slot.to}
                    onChange={e => updateSlot(i, "to", e.target.value)}
                    className="h-7 text-xs w-24 flex-shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeSlot(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
