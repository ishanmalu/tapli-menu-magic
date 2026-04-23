import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

type Restaurant = Tables<"restaurants">;

interface DiscoverRestaurantsProps {
  currentRestaurantId: string;
}

export function DiscoverRestaurants({ currentRestaurantId }: DiscoverRestaurantsProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .neq("id", currentRestaurantId)
          .limit(10);
        if (error) throw error;
        setRestaurants(data || []);
      } catch {
        // silently fail — discover section is non-critical
      }
    };
    load();
  }, [currentRestaurantId]);

  if (restaurants.length === 0) return null;

  return (
    <div className="mt-12">
      <Separator className="mb-6" />
      <div className="text-center mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("discoverMore")}</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {restaurants.map((r) => (
          <Link
            key={r.id}
            to={`/menu/${r.slug}`}
            className="flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors flex-shrink-0"
          >
            {r.logo_url ? (
              <img src={r.logo_url} alt={r.name} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {r.name.charAt(0)}
              </div>
            )}
            <span className="text-xs text-muted-foreground text-center line-clamp-2 leading-tight">{r.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}