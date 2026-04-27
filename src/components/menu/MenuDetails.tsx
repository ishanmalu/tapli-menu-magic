import { Badge } from "@/components/ui/badge";

export function MenuDetails({ item }: { item: any }) {
  if (!item) {
    return (
      <div className="sticky top-6 p-4 rounded-xl bg-white/5 text-white/60">
        Select a dish
      </div>
    );
  }

  return (
    <div className="sticky top-6 rounded-xl bg-white/5 border border-white/10 p-4 space-y-4">
      
      {/* Image */}
      {item.image_url && (
        <img
          src={item.image_url}
          className="w-full h-48 object-cover rounded-lg"
        />
      )}

      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold">{item.name}</h2>
        <p className="text-sm text-white/60 mt-1">
          {item.description}
        </p>
      </div>

      {/* Nutrition */}
      <div className="flex justify-between bg-white/5 rounded-lg p-3">
        <div>
          <div className="text-lg font-semibold">{item.calories ?? "-"} </div>
          <div className="text-xs text-white/60">kcal</div>
        </div>
        <div>
          <div className="text-lg font-semibold">{item.protein ?? "-"}g</div>
          <div className="text-xs text-white/60">protein</div>
        </div>
      </div>

      {/* Allergens */}
      {item.allergens?.length > 0 && (
        <div>
          <h4 className="text-xs text-white/50 mb-2">Allergens</h4>
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
          <h4 className="text-xs text-white/50 mb-2">Lifestyle</h4>
          <div className="flex flex-wrap gap-2">
            {item.dietary_tags.map((d: string) => (
              <Badge key={d}>{d}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Button */}
      <button className="w-full mt-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 transition">
        View Details
      </button>
    </div>
  );
}