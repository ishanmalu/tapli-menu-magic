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
import { LogOut } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";

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
      const { error } = await supabase.rpc("delete_user");
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
        const { data, error } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).maybeSingle();
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

  if (loading || loadingRest) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={theme === "dark" ? tapliLogoDark : tapliLogo} alt="Tapli" className="h-7 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            {restaurant && (
              <a
                href={`/menu/${restaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {t("viewMenu")}
              </a>
            )}
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {!restaurant ? (
          <RestaurantSetup userId={user.id} onCreated={setRestaurant} />
        ) : (
          <MenuManager restaurant={restaurant} onRestaurantUpdate={setRestaurant} />
        )}

        {/* Delete account */}
        <div className="mt-10 pb-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive text-xs"
            onClick={() => { setDeleteConfirmInput(""); setShowDeleteAccount(true); }}
          >
            {t("deleteAccount")}
          </Button>
        </div>

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
                <Button variant="outline" onClick={() => setShowDeleteAccount(false)} disabled={deletingAccount}>
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
      </main>
    </div>
  );
}