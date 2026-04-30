import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Flame, Dumbbell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface MenuItemCardProps {
  item: Tables<"menu_items">;
  onClick?: () => void;
  isActive?: boolean;
  extraTagLabels?: Record<string, string>;
}

export function MenuItemCard({ item, onClick, isActive, extraTagLabels = {} }: MenuItemCardProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const displayName =
    language === "en" && item.name_en ? item.name_en : item.name;

  const displayDescription =
    language === "en" && item.description_en
      ? item.description_en
      : item.description;

  const tagLabels: Record<string, string> = {
    ...extraTagLabels,
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

  const soldOut = item.is_sold_out ?? false;

  const handleClick = (e: React.MouseEvent) => {
    if (soldOut) return;

    e.stopPropagation();

    if (onClick) {
      onClick(); // selection mode
    } else {
      navigate(`/meal/${item.id}`); // fallback navigation
    }
  };

  // Combine and limit tags (UX improvement)
  const visibleTags = [
    ...(item.allergens || []),
    ...(item.dietary_tags || []),
  ].slice(0, 2);

  return (
    <div
      onClick={handleClick}
      className={`
        flex gap-3 rounded-xl border p-3 transition-all duration-200
        ${
          soldOut
            ? "cursor-default select-none opacity-70"
            : "cursor-pointer"
        }
        ${
          isActive
            ? "bg-muted/60 border-primary/50 ring-1 ring-primary/40 shadow-lg"
            : "bg-card border-transparent hover:bg-muted/50 hover:shadow-md hover:scale-[1.01]"
        }
      `}
    >
      {/* Image */}
      {item.photo_url && (
        <div className="relative flex-shrink-0 h-20 w-20">
          <img
            src={item.photo_url}
            alt={displayName}
            className="h-20 w-20 rounded-lg object-cover"
          />

          {soldOut && (
            <div className="absolute inset-0 rounded-lg bg-black/60 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white uppercase tracking-widest text-center px-1">
                {t("soldOut")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title + Price */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-foreground text-sm truncate">
              {displayName}
            </h3>

            {soldOut && !item.photo_url && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {t("soldOut")}
              </span>
            )}
            {/* Item badge */}
            {item.badge === "bestseller" && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full px-2 py-0.5 shrink-0">
                ★ {t("badgeBestseller")}
              </span>
            )}
            {item.badge === "new" && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full px-2 py-0.5 shrink-0">
                ✦ {t("badgeNew")}
              </span>
            )}
          </div>

          <span
            className={`font-bold text-sm whitespace-nowrap ${
              soldOut
                ? "text-muted-foreground line-through"
                : "text-primary"
            }`}
          >
            €{Number(item.price).toFixed(2)}
          </span>
        </div>

        {/* Description */}
        {displayDescription && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {displayDescription}
          </p>
        )}

        {/* Nutrition */}
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          {item.calories != null && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {item.calories} {t("kcal")}
            </span>
          )}
          {item.protein != null && (
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {Number(item.protein)}g {t("protein")}
            </span>
          )}
        </div>

        {/* Tags (limited) */}
        {visibleTags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {visibleTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {tagLabels[tag] || tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}