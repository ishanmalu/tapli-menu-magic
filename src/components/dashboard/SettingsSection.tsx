import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";

/* ── constants ─────────────────────────────────────────────────────────────── */
const CURRENCIES = [
  { symbol: "€", label: "Euro (€)" },
  { symbol: "$", label: "US Dollar ($)" },
  { symbol: "£", label: "British Pound (£)" },
  { symbol: "kr", label: "Scandinavian Krone (kr)" },
  { symbol: "CHF", label: "Swiss Franc (CHF)" },
  { symbol: "zł", label: "Polish Zloty (zł)" },
  { symbol: "Ft", label: "Hungarian Forint (Ft)" },
];

const TIMEZONES = [
  "Europe/Helsinki",
  "Europe/Stockholm",
  "Europe/Oslo",
  "Europe/Copenhagen",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Zurich",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
];

/* ── Card wrapper ──────────────────────────────────────────────────────────── */
function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Row: label + control ──────────────────────────────────────────────────── */
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

/* ── Props ─────────────────────────────────────────────────────────────────── */
interface Props {
  restaurant: Tables<"restaurants">;
  onRestaurantUpdate: (r: Tables<"restaurants">) => void;
  onShowDeleteAccount?: () => void;
}

/* ══════════════════════════════════════════════════════════════════════════════ */
export function SettingsSection({ restaurant, onRestaurantUpdate, onShowDeleteAccount }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  /* ── preferences (stored in filter_settings JSON) ── */
  const fs = (restaurant.filter_settings as any) ?? {};

  /* ── profile (name stored in filter_settings — no profiles table needed) ── */
  const [firstName, setFirstName] = useState<string>(fs.firstName ?? "");
  const [lastName, setLastName] = useState<string>(fs.lastName ?? "");
  const [email] = useState(user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── password ── */
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  /* ── slug ── */
  const [slug, setSlug] = useState(restaurant.slug);
  const [slugError, setSlugError] = useState("");
  const [savingSlug, setSavingSlug] = useState(false);
  const [menuVisible, setMenuVisible] = useState<boolean>(fs.menuVisible !== false);
  const [defaultLang, setDefaultLang] = useState<string>(fs.defaultLanguage ?? "fi");
  const [currency, setCurrency] = useState<string>(fs.currency ?? "€");
  const [timezone, setTimezone] = useState<string>(fs.timezone ?? "Europe/Helsinki");
  const [savingPrefs, setSavingPrefs] = useState(false);

  /* ── notification email ── */
  const [notifEmail, setNotifEmail] = useState<string>(fs.notificationEmail ?? "");
  const [savingNotif, setSavingNotif] = useState(false);

  /* ── save profile (name stored in filter_settings) ── */
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const existing = (restaurant.filter_settings as any) ?? {};
      const { data, error } = await supabase
        .from("restaurants")
        .update({ filter_settings: { ...existing, firstName, lastName } })
        .eq("id", restaurant.id)
        .select()
        .single();
      if (error) throw error;
      if (data) onRestaurantUpdate(data);
      toast({ title: t("saved") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── save password ── */
  const savePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: t("passwordMismatch"), variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: t("passwordTooShort"), variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: t("passwordChanged") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  /* ── save slug ── */
  const saveSlug = async () => {
    const clean = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(clean)) {
      setSlugError(t("menuUrlInvalid"));
      return;
    }
    if (clean === restaurant.slug) return;
    setSavingSlug(true);
    setSlugError("");
    try {
      const { data: existing } = await supabase
        .from("restaurants")
        .select("id")
        .eq("slug", clean)
        .maybeSingle();
      if (existing) {
        setSlugError(t("menuUrlTaken"));
        setSavingSlug(false);
        return;
      }
      const { data, error } = await supabase
        .from("restaurants")
        .update({ slug: clean })
        .eq("id", restaurant.id)
        .select()
        .single();
      if (error) throw error;
      if (data) onRestaurantUpdate(data);
      toast({ title: t("menuUrlSaved") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSavingSlug(false);
    }
  };

  /* ── save prefs (menu visibility, lang, currency, timezone) ── */
  const savePrefs = async (patch: Record<string, unknown>) => {
    setSavingPrefs(true);
    try {
      const existing = (restaurant.filter_settings as any) ?? {};
      const { data, error } = await supabase
        .from("restaurants")
        .update({ filter_settings: { ...existing, ...patch } })
        .eq("id", restaurant.id)
        .select()
        .single();
      if (error) throw error;
      if (data) onRestaurantUpdate(data);
      toast({ title: t("saved") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSavingPrefs(false);
    }
  };

  /* ── save notification email ── */
  const saveNotifEmail = async () => {
    setSavingNotif(true);
    try {
      const existing = (restaurant.filter_settings as any) ?? {};
      const { data, error } = await supabase
        .from("restaurants")
        .update({ filter_settings: { ...existing, notificationEmail: notifEmail } })
        .eq("id", restaurant.id)
        .select()
        .single();
      if (error) throw error;
      if (data) onRestaurantUpdate(data);
      toast({ title: t("saved") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSavingNotif(false);
    }
  };

  const passwordValid =
    newPassword.length >= 8 && newPassword === confirmPassword;

  /* ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <div>
      <div className="px-6 py-5 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">{t("settings")}</h1>
      </div>

      <div className="p-6 space-y-5 max-w-2xl">

        {/* ── Account Information ── */}
        <Card title={t("accountInfo")}>
          <div className="grid grid-cols-2 gap-3">
            <Row label={t("firstName")}>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t("firstName")}
              />
            </Row>
            <Row label={t("lastName")}>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t("lastName")}
              />
            </Row>
          </div>
          <Row label={t("emailAddress")}>
            <Input value={email} disabled className="bg-muted/40 text-muted-foreground" />
          </Row>
          <Button
            size="sm"
            onClick={saveProfile}
            disabled={savingProfile}
            className="w-fit"
          >
            {savingProfile && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {t("saveChanges")}
          </Button>
        </Card>

        {/* ── Change Password ── */}
        <Card title={t("changePassword")}>
          <Row label={t("newPassword")}>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Row>
          <Row label={t("confirmPassword")}>
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">{t("passwordMismatch")}</p>
            )}
          </Row>
          <Button
            size="sm"
            onClick={savePassword}
            disabled={savingPassword || !passwordValid}
            className="w-fit"
          >
            {savingPassword && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {t("changePassword")}
          </Button>
        </Card>

        {/* ── Menu URL ── */}
        <Card title={t("menuUrl")} description={t("menuUrlDesc")}>
          <Row label="tapliapp.com/menu/">
            <div className="flex gap-2">
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugError(""); }}
                placeholder="your-restaurant"
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                onClick={saveSlug}
                disabled={savingSlug || slug === restaurant.slug}
                className="shrink-0"
              >
                {savingSlug && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {t("saveChanges")}
              </Button>
            </div>
            {slugError && <p className="text-xs text-destructive">{slugError}</p>}
            <a
              href={`/menu/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              tapliapp.com/menu/{restaurant.slug}
              <ExternalLink className="h-3 w-3" />
            </a>
          </Row>
        </Card>

        {/* ── Menu Preferences ── */}
        <Card title="Menu Preferences">
          {/* Visibility */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t("menuVisibility")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("menuVisibilityDesc")}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium ${menuVisible ? "text-green-500" : "text-muted-foreground"}`}>
                {menuVisible ? t("menuOnline") : t("menuOffline")}
              </span>
              <Switch
                checked={menuVisible}
                onCheckedChange={(val) => {
                  setMenuVisible(val);
                  savePrefs({ menuVisible: val });
                }}
              />
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Default language */}
          <Row label={t("defaultLanguage")} hint={t("defaultLanguageDesc")}>
            <Select
              value={defaultLang}
              onValueChange={(val) => {
                setDefaultLang(val);
                savePrefs({ defaultLanguage: val });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fi">Finnish (suomi)</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </Row>

          {/* Currency */}
          <Row label={t("currency")} hint={t("currencyDesc")}>
            <Select
              value={currency}
              onValueChange={(val) => {
                setCurrency(val);
                savePrefs({ currency: val });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(({ symbol, label }) => (
                  <SelectItem key={symbol} value={symbol}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          {/* Timezone */}
          <Row label={t("timezoneLabel")} hint={t("timezoneDesc")}>
            <Select
              value={timezone}
              onValueChange={(val) => {
                setTimezone(val);
                savePrefs({ timezone: val });
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          {savingPrefs && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </p>
          )}
        </Card>

        {/* ── Notification Email ── */}
        <Card title={t("notifEmail")} description={t("notifEmailDesc")}>
          <div className="flex gap-2">
            <Input
              type="email"
              value={notifEmail}
              onChange={(e) => setNotifEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={saveNotifEmail}
              disabled={savingNotif}
              className="shrink-0"
            >
              {savingNotif && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {t("saveChanges")}
            </Button>
          </div>
        </Card>

        {/* ── Danger Zone ── */}
        <Card title={t("deleteAccountTitle")}>
          <p className="text-sm text-muted-foreground">{t("deleteAccountDesc")}</p>
          <Button
            variant="destructive"
            size="sm"
            className="w-fit"
            onClick={onShowDeleteAccount}
          >
            {t("deleteAccount")}
          </Button>
        </Card>

      </div>
    </div>
  );
}
