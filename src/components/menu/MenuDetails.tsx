import { Badge } from "@/components/ui/badge";

export function MenuDetails({ item }: { item: any }) {
  if (!item) {
    return (
      <div className="sticky top-6 p-4 rounded-xl bg-muted text-muted-foreground">
        Select a dish
      </div>
    );
  }

  return (
    <div className="sticky top-6 rounded-xl bg-card border border-border p-4 space-y-4">

      {/* Image */}
      {item.image_url && (
        <img
          src={item.image_url}
          className="w-full h-48 object-cover rounded-lg"
        />
      )}

      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {item.name}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {item.description}
        </p>
      </div>

      {/* Nutrition */}
      <div className="flex justify-between bg-muted rounded-lg p-3">
        <div>
          <div className="text-lg font-semibold text-foreground">
            {item.calories ?? "-"}
          </div>
          <div className="text-xs text-muted-foreground">kcal</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">
            {item.protein ?? "-"}g
          </div>
          <div className="text-xs text-muted-foreground">protein</div>
        </div>
      </div>

      {/* Allergens */}
      {item.allergens?.length > 0 && (
        <div>
          <h4 className="text-xs text-muted-foreground mb-2">Allergens</h4>
          <div className="flex flex-wrap gap-2">
            {item.allergens.map((a: string) => (
              <Badge key={a} variant="secondary">{a}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dietary */}
      {item.dietary_tags?.length > 0 && (
        <div>
          <h4 className="text-xs text-muted-foreground mb-2">Lifestyle</h4>
          <div className="flex flex-wrap gap-2">
            {item.dietary_tags.map((d: string) => (
              <Badge key={d}>{d}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Button */}
      <button className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition">
        View Details
      </button>
    </div>
  );
}