import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { MenuFilterBar } from "@/components/menu/MenuFilterBar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { Skeleton } from "@/components/ui/skeleton";

type Restaurant = Tables<"restaurants">;
type MenuItem = Tables<"menu_items">;
type Category = Tables<"categories">;

const ALL_ALLERGENS = ["gluten", "dairy", "nuts", "soy", "eggs"];
const DIETARY_OPTIONS = ["vegan", "vegetarian", "gluten-free"];

export default function CustomerMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Filters
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [calorieRange, setCalorieRange] = useState<[number, number]>([0, 2000]);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const { data: rest } = await supabase.from("restaurants").select("*").eq("slug", slug).single();
      if (!rest) { setNotFound(true); setLoading(false); return; }
      setRestaurant(rest);

      const [{ data: cats }, { data: menuItems }] = await Promise.all([
        supabase.from("categories").select("*").eq("restaurant_id", rest.id).order("sort_order"),
        supabase.from("menu_items").select("*").eq("restaurant_id", rest.id).eq("is_available", true).order("sort_order"),
      ]);
      setCategories(cats || []);
      setItems(menuItems || []);
      setLoading(false);
    };
    load();
  }, [slug]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Exclude items containing selected allergens
      if (excludedAllergens.length > 0 && item.allergens?.some((a) => excludedAllergens.includes(a))) return false;
      // Filter by dietary preference
      if (selectedDietary.length > 0 && !selectedDietary.every((d) => item.dietary_tags?.includes(d))) return false;
      // Filter by calorie range
      if (item.calories != null && (item.calories < calorieRange[0] || item.calories > calorieRange[1])) return false;
      return true;
    });
  }, [items, excludedAllergens, selectedDietary, calorieRange]);

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
          <h1 className="text-2xl font-bold text-foreground">Menu not found</h1>
          <p className="text-muted-foreground mt-2">This restaurant doesn't exist.</p>
        </div>
      </div>
    );
  }

  const hasFilters = excludedAllergens.length > 0 || selectedDietary.length > 0 || calorieRange[0] > 0 || calorieRange[1] < 2000;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Cover photo */}
      {restaurant?.cover_photo_url ? (
        <div className="relative h-48 sm:h-64 w-full overflow-hidden">
          <img src={restaurant.cover_photo_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      ) : (
        <div className="h-24 bg-primary/10" />
      )}

      {/* Restaurant info */}
      <div className="px-4 -mt-8 relative z-10 max-w-2xl mx-auto">
        <div className="flex items-end gap-4 mb-4">
          {restaurant?.logo_url && (
            <img src={restaurant.logo_url} alt={restaurant.name} className="h-16 w-16 rounded-xl border-2 border-background object-cover shadow-md" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{restaurant?.name}</h1>
            {restaurant?.description && <p className="text-sm text-muted-foreground">{restaurant.description}</p>}
          </div>
        </div>

        {/* Filters */}
        <MenuFilterBar
          allergens={ALL_ALLERGENS}
          dietaryOptions={DIETARY_OPTIONS}
          excludedAllergens={excludedAllergens}
          setExcludedAllergens={setExcludedAllergens}
          selectedDietary={selectedDietary}
          setSelectedDietary={setSelectedDietary}
          calorieRange={calorieRange}
          setCalorieRange={setCalorieRange}
        />

        {/* Menu items by category */}
        {groupedItems.length === 0 && hasFilters ? (
          <p className="text-center text-muted-foreground py-12">No items match your filters.</p>
        ) : groupedItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No menu items yet.</p>
        ) : (
          groupedItems.map((group, i) => (
            <div key={group.category?.id || `uncategorized-${i}`} className="mb-6">
              {group.category && (
                <h2 className="text-lg font-semibold text-foreground mb-3 sticky top-0 bg-background py-2 z-10">
                  {group.category.name}
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
      </div>
    </div>
  );
}