import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { FoodStyleChips, FOOD_STYLE_FILTERS } from "@/components/menu/FoodStyleChips";
import { MenuFilterBar } from "@/components/menu/MenuFilterBar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { DiscoverRestaurants } from "@/components/menu/DiscoverRestaurants";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { FREE_FROM_ALLERGENS, DIETARY_LIFESTYLE_TAGS } from "@/constants/menuTags";
import { Clock } from "lucide-react";
import type { AvailabilitySchedule } from "@/integrations/supabase/types";
import { trackMenuViewed, trackFilterUsed } from "@/lib/posthog";

function isAvailableNow(schedule: AvailabilitySchedule | null | undefined): boolean {
  if (!schedule || !schedule.enabled) return true;
  const slots = schedule.slots;
  if (!slots || !Array.isArray(slots) || slots.length === 0) return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return slots.some(({ from, to }) => {
    if (!from || !to) return false;
    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = to.split(":").map(Number);
    if (isNaN(fh) || isNaN(fm) || isNaN(th) || isNaN(tm)) return false;
    return cur >= fh * 60 + fm && cur <= th * 60 + tm;
  });
}

type Restaurant = Tables<"restaurants">;
type MenuItem = Tables<"menu_items">;
type Category = Tables<"categories">;

export default function CustomerMenu() {
  const { slug } = useParams<{ slug: string }>();
  const { t, tCategory, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Filters
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [calorieRange, setCalorieRange] = useState<[number, number]>([0, 2000]);
  const [proteinRange, setProteinRange] = useState<[number, number]>([0, 100]);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 50]);
  const [selectedFoodStyles, setSelectedFoodStyles] = useState<string[]>([]);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const { data: rest, error: restError } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle();
        if (restError || !rest) { setNotFound(true); return; }
        setRestaurant(rest);
        document.title = `Tapli — ${rest.name}`;
        trackMenuViewed({ slug: rest.slug, restaurantName: rest.name });
        // Initialise slider ranges from restaurant settings
        const fs = rest.filter_settings as any;
        if (fs?.calories) setCalorieRange([fs.calories.min, fs.calories.max]);
        if (fs?.protein)  setProteinRange([fs.protein.min, fs.protein.max]);
        if (fs?.budget)   setBudgetRange([fs.budget.min, fs.budget.max]);

        const [{ data: cats, error: catsError }, { data: menuItems, error: itemsError }] = await Promise.all([
          supabase.from("categories").select("*").eq("restaurant_id", rest.id).order("sort_order"),
          supabase.from("menu_items").select("*").eq("restaurant_id", rest.id).eq("is_available", true).order("sort_order"),
        ]);
        if (catsError) throw catsError;
        if (itemsError) throw itemsError;
        setCategories(cats || []);
        setItems(menuItems || []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const fs = restaurant?.filter_settings as any;

  // Track filter usage (only when restaurant is loaded and filters actually change)
  useEffect(() => {
    if (!restaurant || excludedAllergens.length === 0) return;
    trackFilterUsed({ filterType: "allergen", value: excludedAllergens, slug: restaurant.slug });
  }, [excludedAllergens]);

  useEffect(() => {
    if (!restaurant || selectedDietary.length === 0) return;
    trackFilterUsed({ filterType: "dietary", value: selectedDietary, slug: restaurant.slug });
  }, [selectedDietary]);

  useEffect(() => {
    if (!restaurant || selectedFoodStyles.length === 0) return;
    trackFilterUsed({ filterType: "foodStyle", value: selectedFoodStyles, slug: restaurant.slug });
  }, [selectedFoodStyles]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Show only items that have ALL selected "free from" tags
      if (excludedAllergens.length > 0 && !excludedAllergens.every((tag) => item.allergens?.includes(tag))) return false;
      // Filter by dietary preference
      if (selectedDietary.length > 0 && !selectedDietary.every((d) => item.dietary_tags?.includes(d))) return false;
      // Filter by calorie range (only if slider enabled)
      if (fs?.calories?.enabled !== false && item.calories != null && (item.calories < calorieRange[0] || item.calories > calorieRange[1])) return false;
      // Filter by protein range (only if slider enabled)
      if (fs?.protein?.enabled !== false && item.protein != null && (Number(item.protein) < proteinRange[0] || Number(item.protein) > proteinRange[1])) return false;
      // Filter by budget/price range (only if slider enabled)
      if (fs?.budget?.enabled !== false && (Number(item.price) < budgetRange[0] || Number(item.price) > budgetRange[1])) return false;
      // Filter by time-based availability
      if (!isAvailableNow(item.availability_schedule as AvailabilitySchedule | null)) return false;
      // Filter by food style chips
      if (selectedFoodStyles.length > 0) {
        const activeFilters = FOOD_STYLE_FILTERS.filter((f) => selectedFoodStyles.includes(f.id));
        if (!activeFilters.some((f) => f.match(item))) return false;
      }
      return true;
    });
  }, [items, excludedAllergens, selectedDietary, calorieRange, proteinRange, budgetRange, selectedFoodStyles, fs]);

  const groupedItems = useMemo(() => {
    const groups: { category: Category | null; items: MenuItem[] }[] = [];
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const uncategorized: MenuItem[] = [];

    const byCat = new Map<string, MenuItem[]>();
    for (const item of filteredItems) {
      if (item.category_id && catMap.has(item.category_id)) {
        if (!byCat.has(item.category_id)) byCat.set(item.category_id, []);
        byCat.get(item.category_id)!.push(item);
      } else {
        uncategorized.push(item);
      }
    }

    for (const cat of categories) {
      const catItems = byCat.get(cat.id);
      if (catItems?.length) groups.push({ category: cat, items: catItems });
    }
    if (uncategorized.length) groups.push({ category: null, items: uncategorized });
    return groups;
  }, [filteredItems, categories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-48 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("menuNotFound")}</h1>
          <p className="text-muted-foreground mt-2">{t("restaurantNotExist")}</p>
        </div>
      </div>
    );
  }

  const hasFilters = excludedAllergens.length > 0 || selectedDietary.length > 0 || selectedFoodStyles.length > 0 ||
    calorieRange[0] > (fs?.calories?.min ?? 0) || calorieRange[1] < (fs?.calories?.max ?? 2000) ||
    proteinRange[0] > (fs?.protein?.min ?? 0)  || proteinRange[1] < (fs?.protein?.max ?? 100) ||
    budgetRange[0]  > (fs?.budget?.min ?? 0)   || budgetRange[1]  < (fs?.budget?.max ?? 50);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Language + theme toggles */}
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

      {/* Cover photo */}
      {restaurant?.cover_photo_url ? (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/6", maxHeight: "220px" }}>
          <img
            src={restaurant.cover_photo_url}
            alt={restaurant.name}
            className="absolute inset-0 h-full w-full object-cover object-center scale-105"
            style={{ filter: fs?.bannerBlur ? `blur(${(fs.bannerBlur / 100) * 14}px)` : undefined }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="h-16 bg-primary/10" />
      )}

      {/* Restaurant info */}
      <div className="px-4 relative z-10 max-w-2xl mx-auto">
        {/* Logo overlaps banner; name sits cleanly below */}
        {restaurant?.logo_url && (
          <div className="-mt-10 mb-3">
            <img src={restaurant.logo_url} alt={restaurant.name} className="h-16 w-16 rounded-xl border-2 border-background object-cover shadow-md" />
          </div>
        )}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">{restaurant?.name}</h1>
          {restaurant?.slogan && (
            <p className="text-sm font-medium text-primary mt-0.5">{restaurant.slogan}</p>
          )}
          {restaurant && ((language === "en" && restaurant.description_en) ? restaurant.description_en : restaurant.description) && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {(language === "en" && restaurant.description_en) ? restaurant.description_en : restaurant.description}
            </p>
          )}
        </div>

        {/* Opening hours */}
        {restaurant?.opening_hours && (restaurant.opening_hours as {days:string;hours:string}[]).length > 0 && (
          <div className="flex flex-wrap items-start gap-x-4 gap-y-1 mb-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Clock className="h-3.5 w-3.5" /> {t("openingHoursLabel")}
            </span>
            {(restaurant.opening_hours as {days:string;hours:string}[]).map((row, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="font-medium text-foreground">{row.days}</span>
                <span>{row.hours}</span>
              </span>
            ))}
          </div>
        )}

        {/* Filters */}
        <FoodStyleChips selected={selectedFoodStyles} setSelected={setSelectedFoodStyles} />
        <MenuFilterBar
          allergens={[...FREE_FROM_ALLERGENS]}
          dietaryOptions={[...DIETARY_LIFESTYLE_TAGS]}
          excludedAllergens={excludedAllergens}
          setExcludedAllergens={setExcludedAllergens}
          selectedDietary={selectedDietary}
          setSelectedDietary={setSelectedDietary}
          calorieRange={calorieRange}
          setCalorieRange={setCalorieRange}
          calorieSettings={fs?.calories}
          proteinRange={proteinRange}
          setProteinRange={setProteinRange}
          proteinSettings={fs?.protein}
          budgetRange={budgetRange}
          setBudgetRange={setBudgetRange}
          budgetSettings={fs?.budget}
        />

        {/* Menu items by category */}
        {groupedItems.length === 0 && hasFilters ? (
          <p className="text-center text-muted-foreground py-12">{t("noMatchFilters")}</p>
        ) : groupedItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{t("noMenuItems")}</p>
        ) : (
          groupedItems.map((group, i) => (
            <div key={group.category?.id || `uncategorized-${i}`} className="mb-6">
              {group.category && (
                <h2 className="text-lg font-semibold text-foreground mb-3 sticky top-0 bg-background py-2 z-20 will-change-transform [transform:translateZ(0)]">
                  {tCategory(group.category.name)}
                </h2>
              )}
              <div className="space-y-3">
                {group.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Discover other restaurants */}
        {restaurant && <DiscoverRestaurants currentRestaurantId={restaurant.id} />}
      </div>
    </div>
  );
}