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
import { Moon, Sun } from "lucide-react";

import { FREE_FROM_ALLERGENS, DIETARY_LIFESTYLE_TAGS } from "@/constants/menuTags";
import type { AvailabilitySchedule } from "@/types/availability";
import { trackMenuViewed } from "@/lib/posthog";
import {
  type CustomTag,
  type SliderConfig,
  getSlidersFromSettings,
  getItemFieldValue,
} from "@/types/filterSettings";

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

/** Build initial slider values map from a SliderConfig array. */
function buildSliderValues(sliders: SliderConfig[]): Record<string, [number, number]> {
  const result: Record<string, [number, number]> = {};
  sliders.forEach((s) => { result[s.id] = [s.min, s.max]; });
  return result;
}

export default function CustomerMenu() {
  const { slug } = useParams<{ slug: string }>();
  const { t, tCategory, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Filters
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedFoodStyles, setSelectedFoodStyles] = useState<string[]>([]);
  // Dynamic slider state: keyed by slider.id → [currentMin, currentMax]
  const [sliderValues, setSliderValues] = useState<Record<string, [number, number]>>({});

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        const { data: rest, error: restError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (restError || !rest) { setNotFound(true); return; }

        setRestaurant(rest);
        document.title = `Tapli — ${rest.name}`;
        trackMenuViewed({ slug: rest.slug, restaurantName: rest.name });

        // Initialise slider values from restaurant settings
        const sliders = getSlidersFromSettings(rest.filter_settings as any);
        setSliderValues(buildSliderValues(sliders));

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

  // Derived restaurant settings
  const rfSettings = useMemo(() => (restaurant?.filter_settings ?? {}) as any, [restaurant]);
  const sliders = useMemo<SliderConfig[]>(() => getSlidersFromSettings(rfSettings), [rfSettings]);
  const enabledSliders = useMemo(() => sliders.filter((s) => s.enabled), [sliders]);
  const enabledChipIds = useMemo<string[]>(
    () => rfSettings?.foodStyleChips ?? FOOD_STYLE_FILTERS.map((f) => f.id),
    [rfSettings]
  );
  const customTags = useMemo<CustomTag[]>(() => rfSettings?.customTags ?? [], [rfSettings]);

  // Label lookup for manager-defined custom tags — passed to all customer components
  const extraTagLabels = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    customTags.forEach((ct) => { map[ct.id] = ct.label; });
    return map;
  }, [customTags]);

  // Derive which allergens/dietary tags are actually used in items (dynamic filter bar)
  // Includes both built-in tags and custom tags
  const availableAllergens = useMemo(() => {
    const used = new Set<string>();
    items.forEach((item) => item.allergens?.forEach((a) => used.add(a)));
    const builtIn = FREE_FROM_ALLERGENS.filter((a) => used.has(a));
    const custom = customTags
      .filter((ct) => ct.type === "allergen" && used.has(ct.id))
      .map((ct) => ct.id);
    return [...builtIn, ...custom];
  }, [items, customTags]);

  const availableDietary = useMemo(() => {
    const used = new Set<string>();
    items.forEach((item) => item.dietary_tags?.forEach((d) => used.add(d)));
    const builtIn = DIETARY_LIFESTYLE_TAGS.filter((d) => used.has(d));
    const custom = customTags
      .filter((ct) => ct.type === "dietary" && used.has(ct.id))
      .map((ct) => ct.id);
    return [...builtIn, ...custom];
  }, [items, customTags]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Allergen exclusions
      if (
        excludedAllergens.length > 0 &&
        !excludedAllergens.every((tag) => item.allergens?.includes(tag))
      ) return false;

      // Dietary inclusions
      if (
        selectedDietary.length > 0 &&
        !selectedDietary.every((d) => item.dietary_tags?.includes(d))
      ) return false;

      // Dynamic sliders
      for (const s of enabledSliders) {
        const range = sliderValues[s.id];
        if (!range) continue;
        const val = getItemFieldValue(item, s.field);
        if (val != null && (val < range[0] || val > range[1])) return false;
      }

      // Availability schedule
      if (!isAvailableNow(item.availability_schedule as unknown as AvailabilitySchedule | null)) return false;

      // Food style chips
      if (selectedFoodStyles.length > 0) {
        const activeChips = FOOD_STYLE_FILTERS.filter((f) => selectedFoodStyles.includes(f.id));
        if (!activeChips.some((f) => f.match(item))) return false;
      }

      return true;
    });
  }, [items, excludedAllergens, selectedDietary, enabledSliders, sliderValues, selectedFoodStyles]);

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

  const hasFilters = useMemo(() => {
    if (excludedAllergens.length > 0 || selectedDietary.length > 0 || selectedFoodStyles.length > 0) return true;
    return enabledSliders.some((s) => {
      const range = sliderValues[s.id];
      return range ? (range[0] > s.min || range[1] < s.max) : false;
    });
  }, [excludedAllergens, selectedDietary, selectedFoodStyles, enabledSliders, sliderValues]);

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
        {restaurant?.logo_url && (
          <div className="max-w-7xl mx-auto px-4">
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className={`h-16 w-16 rounded-xl border-2 border-background shadow-md object-cover ${
                restaurant?.cover_photo_url ? "-mt-8 relative z-10" : "mt-4"
              }`}
            />
          </div>
        )}
      </div>

      {/* Restaurant Info */}
      <div className="max-w-7xl mx-auto px-4 mt-3 mb-6">
        <h1 className="text-xl font-semibold text-foreground">{restaurant?.name}</h1>
        {restaurant?.slogan && (
          <p className="text-sm text-primary font-medium">{restaurant.slogan}</p>
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

      {/* Layout */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
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
            sliders={sliders}
            sliderValues={sliderValues}
            setSliderValues={setSliderValues}
            extraTagLabels={extraTagLabels}
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
                      extraTagLabels={extraTagLabels}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {restaurant && <DiscoverRestaurants currentRestaurantId={restaurant.id} />}
        </div>

        {/* Detail panel — bottom sheet on mobile, fixed right panel on desktop */}
        {selectedItem && (
          <MenuDetails
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            extraTagLabels={extraTagLabels}
          />
        )}
      </div>
    </div>
  );
}
