import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

import { FoodStyleChips, FOOD_STYLE_FILTERS } from "@/components/menu/FoodStyleChips";
import { MenuFilterBar } from "@/components/menu/MenuFilterBar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { DiscoverRestaurants } from "@/components/menu/DiscoverRestaurants";
import { MenuDetails } from "@/components/menu/MenuDetails";

import { Skeleton } from "@/components/ui/skeleton";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, Clock } from "lucide-react";

import { FREE_FROM_ALLERGENS, DIETARY_LIFESTYLE_TAGS } from "@/constants/menuTags";
import { FOOD_STYLE_FILTERS } from "@/components/menu/FoodStyleChips";
import type { AvailabilitySchedule } from "@/integrations/supabase/types";
import { trackMenuViewed } from "@/lib/posthog";

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

  // 🔥 NEW: selected item
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

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
        if (fs?.protein) setProteinRange([fs.protein.min, fs.protein.max]);
        if (fs?.budget) setBudgetRange([fs.budget.min, fs.budget.max]);

        const [{ data: cats }, { data: menuItems }] = await Promise.all([
          supabase.from("categories").select("*").eq("restaurant_id", rest.id).order("sort_order"),
          supabase.from("menu_items").select("*").eq("restaurant_id", rest.id).eq("is_available", true).order("sort_order"),
        ]);

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


  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (excludedAllergens.length > 0 && !excludedAllergens.every((tag) => item.allergens?.includes(tag))) return false;
      if (selectedDietary.length > 0 && !selectedDietary.every((d) => item.dietary_tags?.includes(d))) return false;

      if (fs?.calories?.enabled !== false && item.calories != null &&
        (item.calories < calorieRange[0] || item.calories > calorieRange[1])) return false;

      if (fs?.protein?.enabled !== false && item.protein != null &&
        (Number(item.protein) < proteinRange[0] || Number(item.protein) > proteinRange[1])) return false;

      if (fs?.budget?.enabled !== false &&
        (Number(item.price) < budgetRange[0] || Number(item.price) > budgetRange[1])) return false;

      if (!isAvailableNow(item.availability_schedule as AvailabilitySchedule | null)) return false;

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

  // Derive which allergens/dietary tags are actually used across menu items.
  // This makes the filter bar dynamic — only shows options the restaurant uses.
  const availableAllergens = useMemo(() => {
    const used = new Set<string>();
    items.forEach((item) => item.allergens?.forEach((a) => used.add(a)));
    return FREE_FROM_ALLERGENS.filter((a) => used.has(a));
  }, [items]);

  const availableDietary = useMemo(() => {
    const used = new Set<string>();
    items.forEach((item) => item.dietary_tags?.forEach((d) => used.add(d)));
    return DIETARY_LIFESTYLE_TAGS.filter((d) => used.has(d));
  }, [items]);

  // Which food style chips the restaurant has enabled
  const enabledChipIds = useMemo(() => {
    const rfSettings = restaurant?.filter_settings as any;
    if (rfSettings?.foodStyleChips) return rfSettings.foodStyleChips as string[];
    // Default: all chips that could match at least one item
    return FOOD_STYLE_FILTERS.map((f) => f.id);
  }, [restaurant]);

  const hasFilters = excludedAllergens.length > 0 || selectedDietary.length > 0 || selectedFoodStyles.length > 0 ||
    calorieRange[0] > (fs?.calories?.min ?? 0) || calorieRange[1] < (fs?.calories?.max ?? 2000) ||
    proteinRange[0] > (fs?.protein?.min ?? 0)  || proteinRange[1] < (fs?.protein?.max ?? 100) ||
    budgetRange[0]  > (fs?.budget?.min ?? 0)   || budgetRange[1]  < (fs?.budget?.max ?? 50);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1>{t("menuNotFound")}</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">

      {/* Top controls */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5">
        <LanguageToggle />
        <button onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Cover photo + logo overlap */}
      <div className="relative">
        {restaurant?.cover_photo_url && (
          <div className="relative w-full h-[200px] md:h-[240px] overflow-hidden">
            <img
              src={restaurant.cover_photo_url}
              alt={restaurant.name}
              className="absolute inset-0 w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
        )}

        {/* Logo overlapping the bottom of the cover photo */}
        {restaurant?.logo_url && (
          <div className="max-w-7xl mx-auto px-4">
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className={`h-16 w-16 rounded-xl border-2 border-background shadow-md object-cover ${restaurant?.cover_photo_url ? "-mt-8 relative z-10" : "mt-4"}`}
            />
          </div>
        )}
      </div>

      {/* Restaurant Info — always below the banner */}
      <div className="max-w-7xl mx-auto px-4 mt-3 mb-6">
        <div className={restaurant?.logo_url ? "ml-0" : ""}>
          <h1 className="text-xl font-semibold text-foreground">
            {restaurant?.name}
          </h1>

          {restaurant?.slogan && (
            <p className="text-sm text-primary font-medium">
              {restaurant.slogan}
            </p>
          )}

          {(language === "en" && restaurant?.description_en
            ? restaurant.description_en
            : restaurant?.description) && (
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {language === "en" && restaurant?.description_en
                ? restaurant.description_en
                : restaurant?.description}
            </p>
          )}
        </div>
      </div>


      {/* Layout */}
      <div className={`mx-auto px-4 mt-4 transition-all duration-300 ${selectedItem ? "max-w-7xl grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6" : "max-w-2xl"}`}>

        {/* LEFT SIDE */}
        <div>
          <FoodStyleChips
            selected={selectedFoodStyles}
            setSelected={setSelectedFoodStyles}
            slug={slug ?? ""}
            enabledIds={enabledChipIds}
          />
          <MenuFilterBar
            slug={slug ?? ""}
            allergens={availableAllergens}
            dietaryOptions={availableDietary}
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
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedItem(item)}
                      isActive={selectedItem?.id === item.id}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {restaurant && <DiscoverRestaurants currentRestaurantId={restaurant.id} />}
        </div>

        {/* RIGHT PANEL (desktop) + BOTTOM SHEET (mobile) */}
        {selectedItem && (
          <MenuDetails item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}

      </div>
    </div>
  );
}