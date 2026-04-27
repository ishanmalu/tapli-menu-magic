import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trackItemViewed } from "@/lib/posthog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Dumbbell, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Moon, Sun } from "lucide-react";

type MenuItem = Tables<"menu_items">;
type Restaurant = Tables<"restaurants">;

export default function MealDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const { data: menuItem, error: itemError } = await supabase
          .from("menu_items")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (itemError) throw itemError;
        if (!menuItem) { setNotFound(true); return; }
        setItem(menuItem);
        trackItemViewed({ itemId: menuItem.id, itemName: menuItem.name, restaurantId: menuItem.restaurant_id });

        const { data: rest, error: restError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", menuItem.restaurant_id)
          .maybeSingle();
        if (restError) throw restError;
        setRestaurant(rest);
        if (menuItem) document.title = `Tapli — ${menuItem.name}`;
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const tagLabels: Record<string, string> = {
    "gluten-free": t("tagGlutenFree"),
    "dairy-free": t("tagDairyFree"),
    "egg-free": t("tagEggFree"),
    "fish-free": t("tagFishFree"),
    "peanut-free": t("tagPeanutFree"),
    "nut-free": t("tagNutFree"),
    "soy-free": t("tagSoyFree"),
    "shellfish-free": t("tagShellfishFree"),
    "sesame-free": t("tagSesameFree"),
    "celery-free": t("tagCeleryFree"),
    "mustard-free": t("tagMustardFree"),
    "sulphite-free": t("tagSulphiteFree"),
    "lupin-free": t("tagLupinFree"),
    "mollusc-free": t("tagMolluscrFree"),
    vegan: t("tagVegan"),
    vegetarian: t("tagVegetarian"),
    "lactose-free": t("tagLactoseFree"),
    "plant-based": t("tagPlantBased"),
    "low-carb": t("tagLowCarb"),
    keto: t("tagKeto"),
    "high-protein": t("tagHighProtein"),
    "no-added-sugar": t("tagNoAddedSugar"),
    "low-calorie": t("tagLowCalorie"),
    halal: t("tagHalal"),
    kosher: t("tagKosher"),
    "no-pork": t("tagNoPork"),
    "no-alcohol": t("tagNoAlcohol"),
    "no-beef": t("tagNoBeef"),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-64 w-full" />
        <div className="p-4 space-y-3 max-w-lg mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("itemNotFound")}</h1>
          <p className="text-muted-foreground mt-2">{t("itemNotFoundDesc")}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-sm text-primary hover:underline"
          >
            {t("backToMenu")}
          </button>
        </div>
      </div>
    );
  }

  const displayName = language === "en" && item.name_en ? item.name_en : item.name;
  const displayDescription = language === "en" && item.description_en ? item.description_en : item.description;
  const soldOut = item.is_sold_out ?? false;

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Toggles */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5">
        <LanguageToggle />
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center rounded-md border bg-muted/50 p-0.5 h-[28px] w-[28px] transition-colors hover:border-primary"
          aria-label="Toggle theme"
        >
          {theme === "dark"
            ? <Sun className="h-3.5 w-3.5 text-foreground" />
            : <Moon className="h-3.5 w-3.5 text-foreground" />}
        </button>
      </div>

      {/* Photo */}
      {item.photo_url ? (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3", maxHeight: "320px" }}>
          <img
            src={item.photo_url}
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {soldOut && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-xl font-bold text-white uppercase tracking-widest">{t("soldOut")}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-20 bg-primary/10" />
      )}

      <div className="px-4 pt-5 max-w-lg mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> {t("backToMenu")}
        </button>

        {/* Name + price */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{displayName}</h1>
            {soldOut && (
              <span className="flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                {t("soldOut")}
              </span>
            )}
          </div>
          <span className={`text-2xl font-bold whitespace-nowrap ${soldOut ? "text-muted-foreground line-through" : "text-primary"}`}>
            €{Number(item.price).toFixed(2)}
          </span>
        </div>

        {/* Restaurant name */}
        {restaurant && (
          <p className="text-sm text-muted-foreground mb-4">{restaurant.name}</p>
        )}

        {/* Description */}
        {displayDescription && (
          <p className="text-base text-foreground/80 leading-relaxed mb-5">{displayDescription}</p>
        )}

        {/* Nutrition */}
        {(item.calories != null || item.protein != null) && (
          <div className="flex gap-4 mb-5 p-3 rounded-xl bg-muted/50 border">
            {item.calories != null && (
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-lg font-bold text-foreground">{item.calories}</p>
                  <p className="text-xs text-muted-foreground">{t("kcal")}</p>
                </div>
              </div>
            )}
            {item.protein != null && (
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-lg font-bold text-foreground">{Number(item.protein)}g</p>
                  <p className="text-xs text-muted-foreground">{t("protein")}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Free From */}
        {item.allergens && item.allergens.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground mb-2">{t("freeFrom")}</p>
            <div className="flex flex-wrap gap-1.5">
              {item.allergens.map((a) => (
                <Badge key={a} variant="outline" className="text-xs">
                  {tagLabels[a] || a}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dietary & Lifestyle */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground mb-2">{t("dietaryAndLifestyle")}</p>
            <div className="flex flex-wrap gap-1.5">
              {item.dietary_tags.map((d) => (
                <Badge key={d} variant="secondary" className="text-xs">
                  {tagLabels[d] || d}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
