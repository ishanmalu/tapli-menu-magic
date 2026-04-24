import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MenuItemForm } from "@/components/dashboard/MenuItemForm";
import { CategoryManager } from "@/components/dashboard/CategoryManager";
import { Plus, Pencil, Trash2, ImageIcon, X } from "lucide-react";
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
      toast({ title: t("errorLoadingMenu"), description: err.message, variant: "destructive" });
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
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingItem(null);
    loadData();
  };

  const uploadRestaurantImage = async (file: File, type: "logo" | "cover") => {
    const maxMB = type === "logo" ? 2 : 5;
    if (file.size > maxMB * 1024 * 1024) {
      toast({ title: t("uploadError"), description: t(type === "logo" ? "logoSizeError" : "coverSizeError"), variant: "destructive" });
      return;
    }
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
      toast({ title: t("uploadError"), description: err.message, variant: "destructive" });
    }
  };

  const removeRestaurantImage = async (type: "logo" | "cover") => {
    try {
      const updatePayload = type === "logo" ? { logo_url: null } : { cover_photo_url: null };
      const { data, error } = await supabase.from("restaurants").update(updatePayload).eq("id", restaurant.id).select().single();
      if (error) throw error;
      if (data) onRestaurantUpdate(data);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
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
        <CardContent className="space-y-5">
          {/* Logo */}
          <div className="flex gap-4 items-start">
            <div className="relative flex-shrink-0">
              <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed hover:border-primary transition-colors overflow-hidden">
                {restaurant.logo_url ? (
                  <img src={restaurant.logo_url} alt={t("logoAlt")} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                )}
                <input type="file" accept="image/png,image/jpeg,image/heic,image/heif" className="hidden" onChange={(e) => e.target.files?.[0] && uploadRestaurantImage(e.target.files[0], "logo")} />
              </label>
              {restaurant.logo_url && (
                <button
                  type="button"
                  onClick={() => removeRestaurantImage("logo")}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  title={t("removePhoto")}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-sm font-medium text-foreground">{t("logo")}</p>
              <p className="text-xs text-muted-foreground">{t("logoRecommended")}</p>
              <p className="text-xs text-muted-foreground">{t("logoFormats")}</p>
              <p className="text-xs text-muted-foreground">{t("logoMaxSize")}</p>
              {restaurant.logo_url && (
                <button type="button" onClick={() => removeRestaurantImage("logo")} className="text-xs text-destructive hover:underline">
                  {t("removePhoto")}
                </button>
              )}
            </div>
          </div>

          {/* Cover photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{t("coverPhoto")}</p>
              <p className="text-xs text-muted-foreground">{t("coverMaxSize")}</p>
            </div>
            <div className="relative">
              <label className="relative flex h-32 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed hover:border-primary transition-colors overflow-hidden group">
                {restaurant.cover_photo_url ? (
                  <>
                    <img src={restaurant.cover_photo_url} alt={t("coverAlt")} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{t("changeCover")}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-1 px-4">
                    <ImageIcon className="h-7 w-7 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">{t("uploadCover")}</p>
                    <p className="text-xs text-muted-foreground">{t("coverRecommended")}</p>
                    <p className="text-xs text-muted-foreground">{t("coverFormats")}</p>
                  </div>
                )}
                <input type="file" accept="image/png,image/jpeg,image/heic,image/heif" className="hidden" onChange={(e) => e.target.files?.[0] && uploadRestaurantImage(e.target.files[0], "cover")} />
              </label>
              {restaurant.cover_photo_url && (
                <button
                  type="button"
                  onClick={() => removeRestaurantImage("cover")}
                  className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 transition-colors z-10"
                >
                  <X className="h-3 w-3" /> {t("removePhoto")}
                </button>
              )}
            </div>
            {restaurant.cover_photo_url && (
              <p className="text-xs text-muted-foreground">{t("coverRecommended")} · {t("coverFormats")}</p>
            )}
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