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
import type { AvailabilitySchedule } from "@/integrations/supabase/types";

function isAvailableNow(schedule: AvailabilitySchedule | null | undefined): boolean {
  if (!schedule || !schedule.enabled || !schedule.slots.length) return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  return schedule.slots.some(({ from, to }) => {
    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = to.split(":").map(Number);
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
        const { data: rest, error: restError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("slug", slug)
          .single();

        if (restError || !rest) {
          setNotFound(true);
          return;
        }

        setRestaurant(rest);
        document.title = `Tapli — ${rest.name}`;

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

        // 🔥 Auto-select first item
        if (menuItems?.length) setSelectedItem(menuItems[0]);

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

      {restaurant?.cover_photo_url && (
        <div className="relative w-full h-[200px] md:h-[240px] overflow-hidden">
          <img
            src={restaurant.cover_photo_url}
            alt={restaurant.name}
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        </div>
      )}

          {/* Restaurant Info */}
    <div className="max-w-7xl mx-auto px-4 -mt-12 mb-6 relative z-10">
      <div className="flex items-start gap-4">

        {/* Logo */}
        {restaurant?.logo_url && (
          <img
            src={restaurant.logo_url}
            alt={restaurant.name}
            className="h-16 w-16 rounded-xl border-2 border-background shadow-md object-cover"
          />
        )}

        {/* Text */}
        <div>
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
    </div>


      {/* Layout */}
      <div className="max-w-7xl mx-auto px-4 mt-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* LEFT SIDE */}
        <div>
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
            proteinRange={proteinRange}
            setProteinRange={setProteinRange}
            budgetRange={budgetRange}
            setBudgetRange={setBudgetRange}
          />

          {groupedItems.map((group, i) => (
            <div key={i}>
              {group.category && (
                <h2 className="text-lg font-semibold mb-3">
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
          ))}
        </div>

        {/* RIGHT PANEL */}
        <div className="hidden lg:block">
          <MenuDetails item={selectedItem} />
        </div>

      </div>
    </div>
  );
}