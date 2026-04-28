import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Tables } from "@/integrations/supabase/types";

interface MenuDetailsProps {
  item: Tables<"menu_items"> | null;
  onClose: () => void;
  extraTagLabels?: Record<string, string>;
}

export function MenuDetails({ item, onClose, extraTagLabels = {} }: MenuDetailsProps) {
  const { t, language } = useLanguage();

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

  if (!item) return null;

  const displayName = language === "en" && item.name_en ? item.name_en : item.name;
  const displayDescription =
    language === "en" && item.description_en ? item.description_en : item.description;
  const soldOut = item.is_sold_out ?? false;

  const content = (
    <div className="space-y-4">
      {/* Header: name + price + close */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground leading-snug">{displayName}</h2>
          <span className={`text-base font-bold ${soldOut ? "text-muted-foreground line-through" : "text-primary"}`}>
            €{Number(item.price).toFixed(2)}
          </span>
          {soldOut && (
            <span className="ml-2 text-xs font-semibold text-destructive">{t("soldOut")}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-full p-1.5 hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Photo */}
      {item.photo_url && (
        <div className="relative overflow-hidden rounded-xl">
          <img src={item.photo_url} alt={displayName} className="w-full h-44 object-cover" />
          {soldOut && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center rounded-xl">
              <span className="text-sm font-bold text-white uppercase tracking-widest">
                {t("soldOut")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {displayDescription && (
        <p className="text-sm text-muted-foreground leading-relaxed">{displayDescription}</p>
      )}

      {/* Nutrition */}
      {(item.calories != null || item.protein != null) && (
        <div className="flex gap-6 bg-muted/50 rounded-xl p-4">
          {item.calories != null && (
            <div>
              <div className="text-xl font-bold text-foreground">{item.calories}</div>
              <div className="text-xs text-muted-foreground">{t("kcal")}</div>
            </div>
          )}
          {item.protein != null && (
            <div>
              <div className="text-xl font-bold text-foreground">{Number(item.protein)}g</div>
              <div className="text-xs text-muted-foreground">{t("protein")}</div>
            </div>
          )}
        </div>
      )}

      {/* Free From */}
      {(item.allergens?.length ?? 0) > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t("freeFrom")}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {item.allergens!.map((a) => (
              <Badge key={a} variant="secondary" className="text-xs">{tagLabels[a] || a}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dietary & Lifestyle */}
      {(item.dietary_tags?.length ?? 0) > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t("dietaryAndLifestyle")}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {item.dietary_tags!.map((d) => (
              <Badge key={d} className="text-xs">{tagLabels[d] || d}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div className="lg:hidden">
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="px-5 pb-8 pt-2">{content}</div>
        </div>
      </div>

      {/* Desktop: sticky sidebar */}
      <div className="hidden lg:block sticky top-4 rounded-2xl border bg-card p-5 shadow-sm">
        {content}
      </div>
    </>
  );
}
