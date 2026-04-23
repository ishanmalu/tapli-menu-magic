import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const ALL_ALLERGENS = ["gluten", "dairy", "nuts", "soy", "eggs"];
const DIETARY_OPTIONS = ["vegan", "vegetarian", "gluten-free"];

interface Props {
  restaurantId: string;
  categories: Tables<"categories">[];
  item: Tables<"menu_items"> | null;
  onSave: () => void;
  onCancel: () => void;
}

export function MenuItemForm({ restaurantId, categories, item, onSave, onCancel }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [categoryId, setCategoryId] = useState(item?.category_id || "");
  const [calories, setCalories] = useState(item?.calories != null ? String(item.calories) : "");
  const [protein, setProtein] = useState(item?.protein != null ? String(item.protein) : "");
  const [allergens, setAllergens] = useState<string[]>(item?.allergens || []);
  const [dietaryTags, setDietaryTags] = useState<string[]>(item?.dietary_tags || []);
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const toggleAllergen = (a: string) =>
    setAllergens(allergens.includes(a) ? allergens.filter((x) => x !== a) : [...allergens, a]);
  const toggleDietary = (d: string) =>
    setDietaryTags(dietaryTags.includes(d) ? dietaryTags.filter((x) => x !== d) : [...dietaryTags, d]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let photoUrl = item?.photo_url || null;
      if (photo) {
        const ext = photo.name.split(".").pop();
        const path = `${restaurantId}/items/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("menu-photos").upload(path, photo);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("menu-photos").getPublicUrl(path);
        photoUrl = publicUrl;
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
        category_id: categoryId || null,
        calories: calories ? parseInt(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        allergens,
        dietary_tags: dietaryTags,
        is_available: isAvailable,
        photo_url: photoUrl,
        restaurant_id: restaurantId,
      };

      const { error } = item
        ? await supabase.from("menu_items").update(payload).eq("id", item.id)
        : await supabase.from("menu_items").insert(payload);

      if (error) throw error;
      onSave();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{t("name")} *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label>{t("description")}</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("price")} *</Label>
          <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div>
          <Label>{t("category")}</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder={t("selectCategory")} /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("calories")}</Label>
          <Input type="number" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} />
        </div>
        <div>
          <Label>{t("proteinG")}</Label>
          <Input type="number" step="0.1" min="0" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>{t("photo")}</Label>
        <Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        {item?.photo_url && !photo && <img src={item.photo_url} alt="" className="h-16 w-16 rounded-md object-cover mt-2" />}
      </div>
      <div>
        <Label>{t("allergens")}</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {ALL_ALLERGENS.map((a) => (
            <Badge key={a} variant={allergens.includes(a) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => toggleAllergen(a)}>{a}</Badge>
          ))}
        </div>
      </div>
      <div>
        <Label>{t("dietaryTags")}</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {DIETARY_OPTIONS.map((d) => (
            <Badge key={d} variant={dietaryTags.includes(d) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => toggleDietary(d)}>{d}</Badge>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
        <Label>{t("available")}</Label>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? t("saving") : item ? t("update") : t("addItem")}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}