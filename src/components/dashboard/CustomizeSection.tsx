import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Check, LayoutList, LayoutGrid, Palette, X } from "lucide-react";
import { FONT_OPTIONS, ACCENT_PRESETS, ALL_GOOGLE_FONTS_URL } from "@/constants/menuCustomization";
import { QRCodeCanvas } from "qrcode.react";

interface Props {
  restaurant: Tables<"restaurants">;
  onRestaurantUpdate: (r: Tables<"restaurants">) => void;
}

function buildGradientStyle(colors: string[], dark: boolean): React.CSSProperties {
  const base = dark ? "#0f0f11" : "#ffffff";
  if (!colors.length) return { background: base };
  const stops = [base, ...colors, base];
  const style = stops.map((c, i) => `${c} ${Math.round((i / (stops.length - 1)) * 100)}%`).join(", ");
  return { background: `linear-gradient(135deg, ${style})` };
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function CustomizeSection({ restaurant, onRestaurantUpdate }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const fs = (restaurant.filter_settings as any) ?? {};

  const [accentColor, setAccentColor] = useState<string>(fs.accentColor ?? "#E63946");
  const [accentMode,  setAccentMode]  = useState<string>(fs.accentMode  ?? "accent");
  const [savingColors, setSavingColors] = useState(false);

  const [headingFont, setHeadingFont] = useState<string>(fs.headingFont ?? "default");

  const [menuLayout, setMenuLayout] = useState<string>(fs.menuLayout ?? "list");
  const [cardStyle,  setCardStyle]  = useState<string>(fs.cardStyle  ?? "minimal");

  const [qrFgColor,  setQrFgColor]  = useState<string>(fs.qrFgColor  ?? "#000000");
  const [qrBgColor,  setQrBgColor]  = useState<string>(fs.qrBgColor  ?? "#ffffff");
  const [qrShowLogo, setQrShowLogo] = useState<boolean>(fs.qrShowLogo ?? false);
  const [savingQr, setSavingQr] = useState(false);

  const [gradientColors, setGradientColors] = useState<string[]>(
    (fs.gradientColors as string[] | undefined) ?? []
  );
  const [savingGradient, setSavingGradient] = useState(false);

  // Load all Google Fonts so the font cards render correctly in the dashboard
  useEffect(() => {
    const id = "tapli-all-fonts-preview";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet"; link.href = ALL_GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  const savePatch = async (patch: Record<string, unknown>) => {
    const existing = (restaurant.filter_settings as any) ?? {};
    const { data, error } = await supabase
      .from("restaurants")
      .update({ filter_settings: { ...existing, ...patch } })
      .eq("id", restaurant.id)
      .select().single();
    if (error) throw error;
    if (data) onRestaurantUpdate(data);
  };

  const saveColors = async () => {
    setSavingColors(true);
    try { await savePatch({ accentColor, accentMode }); toast({ title: t("saved") }); }
    catch (err: any) { toast({ title: t("error"), description: err.message, variant: "destructive" }); }
    finally { setSavingColors(false); }
  };

  const saveFont = async (id: string) => {
    setHeadingFont(id);
    try { await savePatch({ headingFont: id }); toast({ title: t("saved") }); }
    catch (err: any) { toast({ title: t("error"), description: err.message, variant: "destructive" }); }
  };

  const saveLayout = async (layout: string) => {
    setMenuLayout(layout);
    try { await savePatch({ menuLayout: layout }); }
    catch (err: any) { toast({ title: t("error"), description: err.message, variant: "destructive" }); }
  };

  const saveCardStyle = async (style: string) => {
    setCardStyle(style);
    try { await savePatch({ cardStyle: style }); }
    catch (err: any) { toast({ title: t("error"), description: err.message, variant: "destructive" }); }
  };

  const saveQr = async () => {
    setSavingQr(true);
    try { await savePatch({ qrFgColor, qrBgColor, qrShowLogo }); toast({ title: t("saved") }); }
    catch (err: any) { toast({ title: t("error"), description: err.message, variant: "destructive" }); }
    finally { setSavingQr(false); }
  };

  const saveGradientColors = async (colors: string[]) => {
    setSavingGradient(true);
    try { await savePatch({ gradientColors: colors }); }
    catch (err: any) { toast({ title: t("error"), description: err.message, variant: "destructive" }); }
    finally { setSavingGradient(false); }
  };

  const menuUrl = `${window.location.origin}/menu/${restaurant.slug}`;

  return (
    <div>
      <div className="px-6 py-5 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">{t("customize")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("customizeDesc")}</p>
      </div>

      <div className="p-6 space-y-5 max-w-2xl">

        {/* ── Accent Colour ── */}
        <Card title="Accent Colour" description="Choose your restaurant's accent colour — applied live to your public menu.">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {([
              { id: "accent", label: t("accentModeAccent") },
              { id: "full",   label: t("accentModeFull")   },
            ] as const).map(({ id, label }) => (
              <button
                key={id} type="button"
                onClick={() => setAccentMode(id)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all
                  ${accentMode === id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            {accentMode === "accent" ? t("accentModeAccentDesc") : t("accentModeFullDesc")}
          </p>

          {/* Swatches */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("colorPresets")}</p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((color) => (
                <button
                  key={color} type="button"
                  onClick={() => setAccentColor(color)}
                  className="relative h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {accentColor.toLowerCase() === color.toLowerCase() && (
                    <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom picker */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("customColor")}</p>
            <div className="flex items-center gap-3">
              <input
                type="color" value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5 shrink-0"
              />
              <Input
                value={accentColor}
                onChange={(e) => { const v = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setAccentColor(v); }}
                className="font-mono w-28 text-sm" maxLength={7}
              />
            </div>
          </div>

          <Button size="sm" onClick={saveColors} disabled={savingColors} className="w-fit">
            {savingColors && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {t("saveColors")}
          </Button>
        </Card>

        {/* ── Menu Background Gradient ── */}
        <Card title="Menu Background" description="Add gradient colours to your customer-facing menu. In dark mode the base is black, in light mode it's white.">

          {/* Live previews */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg overflow-hidden border border-border">
              <p className="text-[10px] text-center text-muted-foreground py-0.5 bg-muted/40 font-medium tracking-wide uppercase">Light</p>
              <div className="h-16" style={buildGradientStyle(gradientColors, false)} />
            </div>
            <div className="flex-1 rounded-lg overflow-hidden border border-border">
              <p className="text-[10px] text-center text-muted-foreground py-0.5 bg-muted/40 font-medium tracking-wide uppercase">Dark</p>
              <div className="h-16" style={buildGradientStyle(gradientColors, true)} />
            </div>
          </div>

          {/* Added colour swatches */}
          {gradientColors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {gradientColors.map((color, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-2 py-1.5 border border-border">
                  <div className="w-5 h-5 rounded-md border border-border/50 shrink-0" style={{ background: color }} />
                  <span className="text-xs font-mono text-muted-foreground">{color}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = gradientColors.filter((_, j) => j !== i);
                      setGradientColors(next);
                      saveGradientColors(next);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                    aria-label="Remove colour"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add colour button + clear */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-foreground/20 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Add colour</span>
              <input
                type="color"
                className="sr-only"
                value="#000000"
                onChange={(e) => {
                  const next = [...gradientColors, e.target.value];
                  setGradientColors(next);
                  saveGradientColors(next);
                }}
              />
            </label>
            {gradientColors.length > 0 && (
              <button
                type="button"
                onClick={() => { setGradientColors([]); saveGradientColors([]); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            )}
            {savingGradient && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
        </Card>

        {/* ── Typography ── */}
        <Card title={t("typography")} description={t("typographyDesc")}>
          <div className="grid grid-cols-2 gap-2">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.id} type="button"
                onClick={() => saveFont(font.id)}
                className={`relative text-left rounded-xl border p-3 transition-all
                  ${headingFont === font.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
              >
                {headingFont === font.id && (
                  <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </span>
                )}
                <p className="text-lg font-semibold text-foreground leading-tight truncate pr-5"
                   style={{ fontFamily: font.family }}>
                  {font.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5"
                   style={{ fontFamily: font.family }}>
                  Menu · Category · Price
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* ── Menu Layout ── */}
        <Card title={t("menuLayoutTitle")} description={t("menuLayoutDesc")}>
          <div className="flex gap-3">
            {/* List */}
            <button
              type="button" onClick={() => saveLayout("list")}
              className={`flex-1 flex flex-col items-center gap-2.5 rounded-xl border p-4 transition-all
                ${menuLayout === "list" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
            >
              <LayoutList className={`h-5 w-5 ${menuLayout === "list" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${menuLayout === "list" ? "text-primary" : "text-muted-foreground"}`}>
                {t("layoutList")}
              </span>
              <div className="w-full space-y-1.5">
                {[75, 60, 80].map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded ${menuLayout === "list" ? "bg-primary/20" : "bg-muted"} shrink-0`} />
                    <div className="flex-1 space-y-1">
                      <div className={`h-2 rounded-full ${menuLayout === "list" ? "bg-primary/30" : "bg-muted"}`} style={{ width: `${w}%` }} />
                      <div className={`h-1.5 rounded-full ${menuLayout === "list" ? "bg-primary/15" : "bg-muted/60"}`} style={{ width: `${w - 20}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </button>
            {/* Grid */}
            <button
              type="button" onClick={() => saveLayout("grid")}
              className={`flex-1 flex flex-col items-center gap-2.5 rounded-xl border p-4 transition-all
                ${menuLayout === "grid" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
            >
              <LayoutGrid className={`h-5 w-5 ${menuLayout === "grid" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm font-medium ${menuLayout === "grid" ? "text-primary" : "text-muted-foreground"}`}>
                {t("layoutGrid")}
              </span>
              <div className="w-full grid grid-cols-2 gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`rounded-lg p-1.5 ${menuLayout === "grid" ? "bg-primary/20" : "bg-muted"}`}>
                    <div className={`h-8 w-full rounded mb-1 ${menuLayout === "grid" ? "bg-primary/30" : "bg-muted/80"}`} />
                    <div className={`h-1.5 w-2/3 rounded-full ${menuLayout === "grid" ? "bg-primary/20" : "bg-muted/50"}`} />
                  </div>
                ))}
              </div>
            </button>
          </div>
        </Card>

        {/* ── Card Style ── */}
        <Card title={t("cardStyleTitle")} description={t("cardStyleDesc")}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "minimal",  label: t("cardMinimal"),  previewCls: "border-transparent shadow-none" },
              { id: "bordered", label: t("cardBordered"), previewCls: "border-foreground/20 shadow-none" },
              { id: "elevated", label: t("cardElevated"), previewCls: "border-transparent shadow-md" },
            ].map(({ id, label, previewCls }) => (
              <button
                key={id} type="button" onClick={() => saveCardStyle(id)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all
                  ${cardStyle === id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}
              >
                <div className={`w-full rounded-lg border ${previewCls} bg-card p-2`}>
                  <div className="flex gap-1.5 items-center">
                    <div className="h-8 w-8 rounded bg-muted shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-full rounded-full bg-muted" />
                      <div className="h-1.5 w-2/3 rounded-full bg-muted/60" />
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium ${cardStyle === id ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* ── QR Code Style ── */}
        <Card title={t("qrCustomize")} description={t("qrCustomizeDesc")}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("qrFgColor")}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={qrFgColor} onChange={(e) => setQrFgColor(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent p-0.5 shrink-0" />
                <Input value={qrFgColor}
                  onChange={(e) => { const v = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setQrFgColor(v); }}
                  className="font-mono text-sm" maxLength={7} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("qrBgColor")}</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={qrBgColor} onChange={(e) => setQrBgColor(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent p-0.5 shrink-0" />
                <Input value={qrBgColor}
                  onChange={(e) => { const v = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setQrBgColor(v); }}
                  className="font-mono text-sm" maxLength={7} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t("qrShowLogo")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("qrShowLogoDesc")}</p>
            </div>
            <Switch checked={qrShowLogo} onCheckedChange={setQrShowLogo} disabled={!restaurant.logo_url} />
          </div>
          {!restaurant.logo_url && (
            <p className="text-xs text-amber-500">{t("qrShowLogoNoLogo")}</p>
          )}

          {/* Live QR preview */}
          <div className="flex justify-center">
            <div className="p-4 rounded-xl border inline-block" style={{ backgroundColor: qrBgColor }}>
              <QRCodeCanvas
                value={menuUrl}
                size={120}
                bgColor={qrBgColor}
                fgColor={qrFgColor}
                level={qrShowLogo && restaurant.logo_url ? "H" : "M"}
                includeMargin={false}
                imageSettings={qrShowLogo && restaurant.logo_url ? {
                  src: restaurant.logo_url,
                  height: 28,
                  width: 28,
                  excavate: true,
                } : undefined}
              />
            </div>
          </div>

          <Button size="sm" onClick={saveQr} disabled={savingQr} className="w-fit">
            {savingQr && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {t("saveChanges")}
          </Button>
        </Card>

      </div>
    </div>
  );
}
