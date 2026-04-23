import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RestaurantSetup } from "@/components/dashboard/RestaurantSetup";
import { MenuManager } from "@/components/dashboard/MenuManager";
import { LogOut } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import tapliLogo from "@/assets/tapli-logo.png";
import tapliLogoDark from "@/assets/tapli-logo-dark.png";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [restaurant, setRestaurant] = useState<Tables<"restaurants"> | null>(null);
  const [loadingRest, setLoadingRest] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetchRestaurant = async () => {
      try {
        const { data, error } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).maybeSingle();
        if (error) throw error;
        setRestaurant(data);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoadingRest(false);
      }
    };
    fetchRestaurant();
  }, [user]);

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
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
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
      </main>
    </div>
  );
}