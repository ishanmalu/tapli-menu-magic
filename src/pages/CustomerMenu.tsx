import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { FoodStyleChips, FOOD_STYLE_FILTERS } from "@/components/menu/FoodStyleChips";
import { MenuFilterBar } from "@/components/menu/MenuFilterBar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { DiscoverRestaurants } from "@/components/menu/DiscoverRestaurants";
import { MenuDetails } from "@/components/menu/MenuDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, Search, X } from "lucide-react";
import { FREE_FROM_ALLERGENS, DIETARY_LIFESTYLE_TAGS } from "@/constants/menuTags";
import { FONT_OPTIONS } from "@/constants/menuCustomization";
import { ALL_LANGUAGES, getLang } from "@/constants/languages";
import type { AvailabilitySchedule } from "@/types/availability";
import { trackMenuViewed } from "@/lib/posthog";
import {
  type CustomTag,
  type SliderConfig,
  getSlidersFromSettings,
  getItemFieldValue,
} from "@/types/filterSettings";

type HoursRow = { days: string; hours: string };

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
  const { t, tCategory, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Menu display language — starts at restaurant default, can be switched by customer.
  // For core langs (fi/en) we also sync the language context so MenuItemCard / MenuDetails
  // automatically show the right columns. For extra langs we localize items ourselves.
  const [menuLang, setMenuLangState] = useState<string>("fi");

  const setMenuLang = useCallback((code: string) => {
    setMenuLangState(code);
    // For fi/en use the context directly; for extra langs fall back to English
    // so all UI strings (filters, chips, labels) show in English instead of Finnish.
    if (code === "fi" || code === "en") setLanguage(code as "fi" | "en");
    else setLanguage("en");
  }, [setLanguage]);

  // Category navigation
  const [activeCategory, setActiveCategory] = useState<string>("");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
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

        // Set initial menu language from restaurant default setting
        const defaultLang = (rest.filter_settings as any)?.defaultLanguage ?? "fi";
        setMenuLangState(defaultLang);
        if (defaultLang === "fi" || defaultLang === "en") setLanguage(defaultLang as "fi" | "en");
        else setLanguage("en");

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

  // Multi-language support
  const enabledLanguages = useMemo<string[]>(
    () => (rfSettings?.enabledLanguages as string[] | undefined) ?? ["fi", "en"],
    [rfSettings]
  );
  const availableLangs = useMemo(
    () => ALL_LANGUAGES.filter((l) => enabledLanguages.includes(l.code)),
    [enabledLanguages]
  );

  // For extra languages (not fi/en), override the item's core fields with translated text
  // so that MenuItemCard and MenuDetails display the right language without needing changes.
  const localizeItem = useCallback((item: MenuItem): MenuItem => {
    if (menuLang === "fi" || menuLang === "en") return item; // handled by context
    const tr = (item.translations as Record<string, { name?: string; description?: string; ingredients?: string[] }> | null ?? {})[menuLang] ?? {};
    return {
      ...item,
      name:          tr.name        || item.name_en    || item.name,
      name_en:       tr.name        || item.name_en,
      description:   tr.description || item.description_en || item.description,
      description_en: tr.description || item.description_en,
      ingredients:   (tr.ingredients?.length ? tr.ingredients : null) ?? item.ingredients_en ?? item.ingredients,
      ingredients_en: (tr.ingredients?.length ? tr.ingredients : null) ?? item.ingredients_en,
    };
  }, [menuLang]);

  // Helper: get category display name in current menuLang
  const getCategoryDisplayName = useCallback((cat: Category): string => {
    if (menuLang === "fi") return cat.name;
    if (menuLang === "en") return (cat as any).name_en || cat.name;
    const tr = (cat.translations as Record<string, string> | null) ?? {};
    return tr[menuLang] || (cat as any).name_en || cat.name;
  }, [menuLang]);

  // Customization
  const accentColor   = rfSettings.accentColor   as string | undefined;
  const accentMode    = (rfSettings.accentMode   as string) || "accent";
  const headingFont   = (rfSettings.headingFont  as string) || "default";
  const menuLayout    = (rfSettings.menuLayout   as string) || "list";
  const cardStyle     = (rfSettings.cardStyle    as string) || "minimal";
  const headingFontFamily = FONT_OPTIONS.find((f) => f.id === headingFont)?.family ?? "Inter, sans-serif";

  // Background gradient
  const gradientColors = useMemo<string[]>(
    () => (rfSettings.gradientColors as string[] | undefined) ?? [],
    [rfSettings]
  );
  const backgroundStyle = useMemo((): React.CSSProperties => {
    if (!gradientColors.length) return {};
    const isDark = theme === "dark";
    const base = isDark ? "#0f0f11" : "#ffffff";
    const stops = [base, ...gradientColors, base];
    const gradient = stops.map((c, i) => `${c} ${Math.round((i / (stops.length - 1)) * 100)}%`).join(", ");
    return { background: `linear-gradient(135deg, ${gradient})` };
  }, [gradientColors, theme]);

  // Load heading font from Google Fonts
  useEffect(() => {
    const fontOpt = FONT_OPTIONS.find((f) => f.id === headingFont);
    if (!fontOpt?.googleFont) return;
    const linkId = `tapli-font-${headingFont}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement("link");
    link.id = linkId; link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontOpt.googleFont}&display=swap`;
    document.head.appendChild(link);
  }, [headingFont]);

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
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      // Search query — checks name, description, ingredients, category, tags across all languages
      if (q) {
        const cat = categories.find((c) => c.id === item.category_id);
        const catName = cat ? getCategoryDisplayName(cat).toLowerCase() : "";
        const tr = (item.translations as Record<string, { name?: string; description?: string; ingredients?: string[] }> | null) ?? {};
        const allNames = [item.name, item.name_en, ...Object.values(tr).map((t) => t.name ?? "")].filter(Boolean).join(" ").toLowerCase();
        const allDescs = [item.description, item.description_en, ...Object.values(tr).map((t) => t.description ?? "")].filter(Boolean).join(" ").toLowerCase();
        const allIngr = [...(item.ingredients ?? []), ...(item.ingredients_en ?? []), ...Object.values(tr).flatMap((t) => t.ingredients ?? [])].join(" ").toLowerCase();
        const allTags = [...(item.dietary_tags ?? []), ...(item.allergens ?? [])].join(" ").toLowerCase();
        // Also match food-style chip IDs that apply to this item
        const chipIds = FOOD_STYLE_FILTERS.filter((f) => f.match(item)).map((f) => f.id).join(" ").toLowerCase();
        const fullText = `${allNames} ${allDescs} ${allIngr} ${allTags} ${catName} ${chipIds}`;
        if (!fullText.includes(q)) return false;
      }

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
  }, [items, searchQuery, excludedAllergens, selectedDietary, enabledSliders, sliderValues, selectedFoodStyles, categories, getCategoryDisplayName]);

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
    if (searchQuery.trim()) return true;
    if (excludedAllergens.length > 0 || selectedDietary.length > 0 || selectedFoodStyles.length > 0) return true;
    return enabledSliders.some((s) => {
      const range = sliderValues[s.id];
      return range ? (range[0] > s.min || range[1] < s.max) : false;
    });
  }, [searchQuery, excludedAllergens, selectedDietary, selectedFoodStyles, enabledSliders, sliderValues]);

  // IntersectionObserver — highlight active category tab while scrolling
  useEffect(() => {
    if (groupedItems.length === 0) return;
    setActiveCategory(groupedItems[0].category?.id ?? "uncategorized");

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveCategory(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [groupedItems]);

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (!activeCategory || !tabBarRef.current) return;
    const activeTab = tabBarRef.current.querySelector(`[data-cat="${activeCategory}"]`);
    if (activeTab) activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCategory]);

  const scrollToSection = useCallback((catId: string) => {
    setActiveCategory(catId);
    const el = sectionRefs.current[catId];
    if (!el) return;
    const offset = (tabBarRef.current?.offsetHeight ?? 44) + 8;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
  }, []);

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

  // Menu visibility — owner can take the menu offline from Settings
  const isOnline = (restaurant?.filter_settings as any)?.menuVisible !== false;
  if (!loading && restaurant && !isOnline) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center bg-background">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">🔒</div>
        <h1 className="text-xl font-semibold text-foreground">{t("menuOfflineTitle")}</h1>
        <p className="text-sm text-muted-foreground max-w-xs">{t("menuOfflineDesc")}</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pb-8 ${gradientColors.length ? "" : "bg-background"}`}
      style={backgroundStyle}
    >

      {/* Top controls */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5">
        {/* Menu language switcher — only shown when more than 2 languages are enabled */}
        {availableLangs.length > 1 && (
          <div className="flex items-center gap-0.5 bg-background/80 backdrop-blur-md border border-foreground/10 rounded-xl px-1.5 py-1 shadow-sm">
            {availableLangs.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setMenuLang(lang.code)}
                title={lang.label}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                  menuLang === lang.code
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang.flag} {lang.code.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        <button onClick={toggleTheme} className="p-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-foreground/10 shadow-sm">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Cover photo */}
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

      {/* Logo + restaurant info */}
      <div className="max-w-2xl mx-auto px-4 mb-6 text-center">
        {restaurant?.logo_url && (
          <div className="flex justify-center">
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className={`h-20 w-20 rounded-2xl border-2 border-background shadow-md object-cover ${
                restaurant?.cover_photo_url ? "-mt-10 relative z-10" : "mt-4"
              }`}
            />
          </div>
        )}
        <div className={restaurant?.logo_url ? "mt-3" : "mt-4"}>
          <h1 className="text-xl font-semibold" style={{
            fontFamily: headingFontFamily,
            color: accentMode === "full" && accentColor ? accentColor : undefined,
          }}>
            {restaurant?.name}
          </h1>
          {restaurant?.slogan && (
            <p className="text-sm font-medium mt-0.5" style={{ color: accentColor || undefined }}>
              {restaurant.slogan}
            </p>
          )}
          {(language === "en" && restaurant?.description_en
            ? restaurant.description_en
            : restaurant?.description) && (
            <p className="text-sm text-muted-foreground mt-1">
              {language === "en" && restaurant?.description_en
                ? restaurant.description_en
                : restaurant?.description}
            </p>
          )}
          {/* Opening hours */}
          {(() => {
            const hours = (restaurant?.opening_hours as HoursRow[] | null) ?? [];
            if (!hours.length) return null;
            return (
              <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1">
                {hours.map((row, i) => (
                  <span key={i} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{row.days}</span>
                    {" · "}{row.hours}
                  </span>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Layout */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div>
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu…"
              className="w-full h-9 pl-8.5 pr-8 rounded-full border border-border/60 bg-background/70 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
              style={{ paddingLeft: "2.1rem" }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

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

          {/* Sticky category tab bar — hidden during search */}
          {groupedItems.length > 1 && !searchQuery.trim() && (
            <div
              ref={tabBarRef}
              className="sticky top-0 z-30 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur-sm border-b border-border/40 mb-4"
            >
              <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {groupedItems.map((group) => {
                  const id = group.category?.id ?? "uncategorized";
                  const label = group.category ? getCategoryDisplayName(group.category) : t("uncategorized");
                  const isActive = activeCategory === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      data-cat={id}
                      onClick={() => scrollToSection(id)}
                      style={isActive && accentColor ? { backgroundColor: accentColor, color: "#fff" } : undefined}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all
                        ${isActive
                          ? accentColor ? "shadow-sm" : "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                      {label}
                      <span className="ml-1.5 opacity-60">{group.items.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {groupedItems.length === 0 && hasFilters ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                {searchQuery.trim() ? `No results for "${searchQuery.trim()}"` : t("noMatchFilters")}
              </p>
              {searchQuery.trim() && (
                <button onClick={() => setSearchQuery("")} className="mt-2 text-xs text-primary hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : groupedItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t("noMenuItems")}</p>
          ) : (
            groupedItems.map((group, i) => (
              <div
                key={group.category?.id || `uncategorized-${i}`}
                id={group.category?.id ?? "uncategorized"}
                ref={(el) => { sectionRefs.current[group.category?.id ?? "uncategorized"] = el; }}
                className="mb-8"
              >
                {group.category && (
                  <h2 className="text-base font-bold mb-3 pt-1" style={{
                    fontFamily: headingFontFamily,
                    color: accentMode === "full" && accentColor ? accentColor : undefined,
                  }}>
                    {getCategoryDisplayName(group.category)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground" style={{ fontFamily: "Inter, sans-serif", color: undefined }}>{group.items.length}</span>
                  </h2>
                )}
                <div className={menuLayout === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
                  {group.items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={localizeItem(item)}
                      onClick={() => setSelectedItem(item)}
                      isActive={selectedItem?.id === item.id}
                      extraTagLabels={extraTagLabels}
                      accentColor={accentColor}
                      accentMode={accentMode}
                      cardStyle={cardStyle}
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
            item={localizeItem(selectedItem)}
            onClose={() => setSelectedItem(null)}
            extraTagLabels={extraTagLabels}
            excludedAllergens={excludedAllergens}
          />
        )}
      </div>
    </div>
  );
}
