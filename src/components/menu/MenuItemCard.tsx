import type { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Flame, Dumbbell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MenuItemCardProps {
  item: Tables<"menu_items">;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { t } = useLanguage();
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-md">
      {item.photo_url && (
        <img
          src={item.photo_url}
          alt={item.name}
          className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-sm leading-tight">{item.name}</h3>
          <span className="font-bold text-primary text-sm whitespace-nowrap">€{Number(item.price).toFixed(2)}</span>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {item.calories != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="h-3 w-3" /> {item.calories} {t("kcal")}
            </span>
          )}
          {item.protein != null && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Dumbbell className="h-3 w-3" /> {Number(item.protein)}g {t("protein")}
            </span>
          )}
        </div>
        {item.allergens && item.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.allergens.map((a) => (
              <Badge key={a} variant="outline" className="text-[10px] capitalize px-1.5 py-0">{a}</Badge>
            ))}
          </div>
        )}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.dietary_tags.map((d) => (
              <Badge key={d} variant="secondary" className="text-[10px] capitalize px-1.5 py-0">{d}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}