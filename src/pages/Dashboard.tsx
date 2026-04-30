import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RestaurantSetup } from "@/components/dashboard/RestaurantSetup";
import { MenuManager } from "@/components/dashboard/MenuManager";
import {
  LogOut, QrCode, UtensilsCrossed, LayoutGrid,
  SlidersHorizontal, Settings, Store, HelpCircle, ExternalLink,
} from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";

export type DashboardSection =
  | "menu"
  | "categories"
  | "tags"
  | "restaurant"
  | "qr"
  | "settings";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);
  const [loadingRest, setLoadingRest] = useState(true);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>("menu");
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    if (deleteConfirmInput !== "DELETE") return;
    setDeletingAccount(true);
    try {
      if (restaurant) {
        await supabase.from("menu_items").delete().eq("restaurant_id", restaurant.id);
        await supabase.from("categories").delete().eq("restaurant_id", restaurant.id);
        await supabase.from("restaurants").delete().eq("id", restaurant.id);
      }
      const { error } = await (supabase.rpc as any)("delete_user");
      if (error) throw error;
      await signOut();
      navigate("/");
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchRestaurant = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();
        if (error) throw error;
        setRestaurant(data);
      } catch (err: any) {
        toast({ title: t("error"), description: err.message, variant: "destructive" });
      } finally {
        setLoadingRest(false);
      }
    };
    fetchRestaurant();
  }, [user]);

  useEffect(() => { document.title = "Tapli — Dashboard"; }, []);

  if (loading || loadingRest) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const navItems: { id: DashboardSection; icon: React.ElementType; label: string }[] = [
    { id: "menu",       icon: UtensilsCrossed,  label: t("menuItems") },
    { id: "categories", icon: LayoutGrid,        label: t("categories") },
    { id: "tags",       icon: SlidersHorizontal, label: t("tagsAndFilters") },
    { id: "restaurant", icon: Store,             label: t("restaurant") },
    { id: "qr",         icon: QrCode,            label: t("qrCode") },
    { id: "settings",   icon: Settings,          label: t("settings") },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 bg-card border-r border-border flex flex-col">

        {/* Restaurant identity */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-primary/20 flex items-center justify-center">
              {restaurant?.logo_url
                ? <img src={restaurant.logo_url} alt="" className="h-full w-full object-cover" />
                : <UtensilsCrossed className="h-5 w-5 text-primary" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {restaurant?.name ?? "Tapli"}
              </p>
              <p className="text-xs text-muted-foreground">{t("menuManager")}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left
                ${activeSection === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        {/* Help card */}
        <div className="p-3 border-t border-border">
          <div className="rounded-xl bg-muted/40 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <HelpCircle className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">{t("needHelp")}</p>
            </div>
            <a
              href="/contact"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              {t("visitHelpCenter")} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top utility bar */}
        <header className="h-14 shrink-0 border-b border-border bg-card px-5 flex items-center justify-between">
          <img
            src={theme === "dark" ? tapliLogoDark : tapliLogo}
            alt="Tapli"
            className="h-6 w-auto"
          />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {!restaurant ? (
            <div className="p-6">
              <RestaurantSetup userId={user.id} onCreated={setRestaurant} />
            </div>
          ) : (
            <MenuManager
              restaurant={restaurant}
              onRestaurantUpdate={setRestaurant}
              activeSection={activeSection}
              onShowDeleteAccount={() => { setDeleteConfirmInput(""); setShowDeleteAccount(true); }}
            />
          )}
        </main>
      </div>

      {/* ── Delete account dialog ── */}
      <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t("deleteAccountTitle")}</DialogTitle>
            <DialogDescription>{t("deleteAccountDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground font-medium">{t("typeDeleteConfirm")}</p>
            <Input
              placeholder="DELETE"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              className="font-mono"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteAccount(false)}
                disabled={deletingAccount}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmInput !== "DELETE" || deletingAccount}
                onClick={handleDeleteAccount}
              >
                {deletingAccount ? t("deleting") : t("deleteAccount")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
