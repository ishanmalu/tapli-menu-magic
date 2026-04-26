import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Flame, Dumbbell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface MenuItemCardProps {
  item: Tables<"menu_items">;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const displayName =
    language === "en" && item.name_en ? item.name_en : item.name;

  const displayDescription =
    language === "en" && item.description_en
      ? item.description_en
      : item.description;

  // Translated display labels for all tag slugs
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

  const soldOut = item.is_sold_out ?? false;

  return (
    <div
      onClick={() => !soldOut && navigate(`/meal/${item.id}`)}
      className={`flex gap-3 rounded-lg border bg-card p-3 transition-all
        ${soldOut
          ? "opacity-50 cursor-default select-none"
          : "hover:shadow-md hover:scale-[1.01] hover:bg-muted/50 cursor-pointer"}`}
    >
      {item.photo_url && (
        <div className="relative flex-shrink-0">
          <img
            src={item.photo_url}
            alt={item.name}
            className="h-20 w-20 rounded-lg object-cover"
          />
          {soldOut && (
            <div className="absolute inset-0 rounded-lg bg-black/55 flex items-center justify-center">
              <span className="text-[11px] font-bold text-white uppercase tracking-widest text-center leading-tight px-1">
                {t("soldOut")}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
              {displayName}
            </h3>
            {soldOut && !item.photo_url && (
              <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {t("soldOut")}
              </span>
            )}
          </div>
          <span className={`font-bold text-sm whitespace-nowrap ${soldOut ? "text-muted-foreground line-through" : "text-primary"}`}>
            €{Number(item.price).toFixed(2)}
          </span>
        </div>

        {displayDescription && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {displayDescription}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {item.calories != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="h-3 w-3" /> {item.calories} {t("kcal")}
            </span>
          )}
          {item.protein != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Dumbbell className="h-3 w-3" /> {Number(item.protein)}g{" "}
              {t("protein")}
            </span>
          )}
        </div>

        {/* Free From badges */}
        {item.allergens && item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.allergens.map((a) => (
              <Badge
                key={a}
                variant="outline"
                className="text-[10px] px-1.5 py-0"
              >
                {tagLabels[a] || a}
              </Badge>
            ))}
          </div>
        )}

        {/* Dietary & Lifestyle badges */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.dietary_tags.map((d) => (
              <Badge
                key={d}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {tagLabels[d] || d}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}