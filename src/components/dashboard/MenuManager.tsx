import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MenuItemForm } from "@/components/dashboard/MenuItemForm";
import { CategoryManager } from "@/components/dashboard/CategoryManager";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

type MenuItem = Tables<"menu_items">;
type Category = Tables<"categories">;

interface Props {
  restaurant: Tables<"restaurants">;
  onRestaurantUpdate: (r: Tables<"restaurants">) => void;
}

export function MenuManager({ restaurant, onRestaurantUpdate }: Props) {
  const { t } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [{ data: cats, error: catsError }, { data: menuItems, error: itemsError }] = await Promise.all([
        supabase.from("categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
        supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
      ]);
      if (catsError) throw catsError;
      if (itemsError) throw itemsError;
      setCategories(cats || []);
      setItems(menuItems || []);
    } catch (err: any) {
      toast({ title: "Error loading menu", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [restaurant.id]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingItem(null);
    loadData();
  };

  const uploadRestaurantImage = async (file: File, type: "logo" | "cover") => {
    try {
      const ext = file.name.split(".").pop();
      const path = `${restaurant.id}/${type}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("menu-photos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("menu-photos").getPublicUrl(path);
      const updatePayload = type === "logo" ? { logo_url: publicUrl } : { cover_photo_url: publicUrl };
      const { data, error } = await supabase.from("restaurants").update(updatePayload).eq("id", restaurant.id).select().single();
      if (error) throw error;
      if (data) onRestaurantUpdate(data);
    } catch (err: any) {
      toast({ title: "Upload error", description: err.message, variant: "destructive" });
    }
  };

  const getCategoryName = (catId: string | null) => categories.find((c) => c.id === catId)?.name || t("uncategorized");

  if (loading) return <div className="text-center py-8 text-muted-foreground">{t("loadingMenu")}</div>;

  return (
    <div className="space-y-6">
      {/* Restaurant branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("restaurantBranding")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{t("logo")}</p>
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:border-primary transition-colors overflow-hidden">
              {restaurant.logo_url ? (
                <img src={restaurant.logo_url} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadRestaurantImage(e.target.files[0], "logo")} />
            </label>
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm text-muted-foreground mb-2">{t("coverPhoto")}</p>
            <label className="flex h-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed hover:border-primary transition-colors overflow-hidden">
              {restaurant.cover_photo_url ? (
                <img src={restaurant.cover_photo_url} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">{t("uploadCover")}</span>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadRestaurantImage(e.target.files[0], "cover")} />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <CategoryManager restaurantId={restaurant.id} categories={categories} onUpdate={loadData} />

      {/* Menu items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("menuItems")} ({items.length})</CardTitle>
          <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingItem(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> {t("addItem")}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? t("editItem") : t("addMenuItem")}</DialogTitle>
              </DialogHeader>
              <MenuItemForm
                restaurantId={restaurant.id}
                categories={categories}
                item={editingItem}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingItem(null); }}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("noItemsYet")}</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                  {item.photo_url ? (
                    <img src={item.photo_url} alt={item.name} className="h-12 w-12 rounded-md object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{getCategoryName(item.category_id)} · €{Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingItem(item); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}