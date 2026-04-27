import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MenuItemForm } from "@/components/dashboard/MenuItemForm";
import { CategoryManager } from "@/components/dashboard/CategoryManager";
import { RestaurantInfoEditor } from "@/components/dashboard/RestaurantInfoEditor";
import { FilterSettingsEditor } from "@/components/dashboard/FilterSettingsEditor";
import { QRCodeCard } from "@/components/dashboard/QRCodeCard";
import { Plus, Pencil, Trash2, ImageIcon, X, Search, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { compressImage, localPreview } from "@/lib/imageUtils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const { toast } = useToast();

  const fs = restaurant.filter_settings as any;
  const [bannerBlur, setBannerBlur] = useState<number>(fs?.bannerBlur ?? 0);
  // Optimistic local previews shown instantly while upload runs in background
  const [logoPreview,  setLogoPreview]  = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [itemPreviews, setItemPreviews] = useState<Record<string, string>>({});

  const pasteImage = (e: React.ClipboardEvent, fn: (file: File) => void) => {
    const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith("image/"));
    if (item) { e.preventDefault(); const f = item.getAsFile(); if (f) fn(f); }
  };

  const saveBannerBlur = async (value: number) => {
    try {
      const existing = (restaurant.filter_settings as any) ?? {};
      const { data, error } = await supabase
        .from("restaurants")
        .update({ filter_settings: { ...existing, bannerBlur: value } })
        .eq("id", restaurant.id)
        .select()
        .single();
      if (error) throw error;
      if (data) onRestaurantUpdate(data);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

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
    // Show local preview instantly
    const preview = localPreview(file);
    if (type === "logo") setLogoPreview(preview); else setCoverPreview(preview);
    try {
      const maxWidth = type === "logo" ? 400 : 1600;
      const quality  = type === "logo" ? 0.88 : 0.85;
      const compressed = await compressImage(file, maxWidth, quality);
      const path = `${restaurant.id}/${type}.jpg`;
      const { error: uploadError } = await supabase.storage.from("menu-photos").upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("menu-photos").getPublicUrl(path);
      const freshUrl = `${publicUrl}?t=${Date.now()}`;
      const updatePayload = type === "logo" ? { logo_url: freshUrl } : { cover_photo_url: freshUrl };
      const { data, error } = await supabase.from("restaurants").update(updatePayload).eq("id", restaurant.id).select().single();
      if (error) throw error;
      if (data) onRestaurantUpdate(data);
    } catch (err: any) {
      toast({ title: t("uploadError"), description: err.message, variant: "destructive" });
    } finally {
      if (type === "logo") setLogoPreview(null); else setCoverPreview(null);
      URL.revokeObjectURL(preview);
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

  const uploadItemPhoto = async (item: MenuItem, file: File) => {
    // Show local preview instantly
    const preview = localPreview(file);
    setItemPreviews(p => ({ ...p, [item.id]: preview }));
    try {
      const compressed = await compressImage(file, 800, 0.85);
      const path = `${restaurant.id}/items/${item.id}.jpg`;
      const { error: uploadError } = await supabase.storage.from("menu-photos").upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("menu-photos").getPublicUrl(path);
      const freshUrl = `${publicUrl}?t=${Date.now()}`;
      const { error } = await supabase.from("menu_items").update({ photo_url: freshUrl }).eq("id", item.id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      toast({ title: t("uploadError"), description: err.message, variant: "destructive" });
    } finally {
      setItemPreviews(p => { const n = { ...p }; delete n[item.id]; return n; });
      URL.revokeObjectURL(preview);
    }
  };

  const removeItemPhoto = async (item: MenuItem) => {
    try {
      const { error } = await supabase.from("menu_items").update({ photo_url: null }).eq("id", item.id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const toggleSoldOut = async (item: MenuItem) => {
    try {
      const { error } = await supabase.from("menu_items").update({ is_sold_out: !item.is_sold_out }).eq("id", item.id);
      if (error) throw error;
      // Optimistic local update — no full reload needed
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_sold_out: !item.is_sold_out } : i));
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">{t("loadingMenu")}</div>;

  return (
    <div className="space-y-6">
      {/* Restaurant info — name, slogan, description, opening hours */}
      <RestaurantInfoEditor restaurant={restaurant} onUpdate={onRestaurantUpdate} />

      {/* QR Code */}
      <QRCodeCard slug={restaurant.slug} restaurantName={restaurant.name} />

      {/* Filter slider settings */}
      <FilterSettingsEditor restaurant={restaurant} onUpdate={onRestaurantUpdate} />

      {/* Restaurant branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("restaurantBranding")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo */}
          <div className="flex gap-4 items-start">
            <div className="relative flex-shrink-0">
              <label
                tabIndex={0}
                onPaste={(e) => pasteImage(e, (f) => uploadRestaurantImage(f, "logo"))}
                className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed hover:border-primary transition-colors overflow-hidden focus:outline-none focus:border-primary"
              >
                {(logoPreview || restaurant.logo_url) ? (
                  <img src={logoPreview ?? restaurant.logo_url!} alt={t("logoAlt")} className="h-full w-full object-cover" />
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
              <p className="text-xs text-muted-foreground/60">{t("pasteHint")}</p>
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
              <label
                tabIndex={0}
                onPaste={(e) => pasteImage(e, (f) => uploadRestaurantImage(f, "cover"))}
                className="relative flex h-32 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed hover:border-primary transition-colors overflow-hidden group focus:outline-none focus:border-primary"
              >
                {(coverPreview || restaurant.cover_photo_url) ? (
                  <>
                    <img src={coverPreview ?? restaurant.cover_photo_url!} alt={t("coverAlt")} className="h-full w-full object-cover" />
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
                    <p className="text-xs text-muted-foreground/60">{t("pasteHint")}</p>
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

          {/* Banner blur */}
          {restaurant.cover_photo_url && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{t("bannerBlur")}</p>
                <span className="text-xs text-muted-foreground">{bannerBlur}%</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("bannerBlurDesc")}</p>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[bannerBlur]}
                onValueChange={([v]) => {
                  setBannerBlur(v);
                  saveBannerBlur(v);
                }}
              />
            </div>
          )}
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
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("noItemsYet")}</p>
          ) : (
            <>
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchItems")}
                  className="pl-8 h-8 text-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category filter tabs */}
              {categories.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryId("all")}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border
                      ${activeCategoryId === "all"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary"}`}
                  >
                    {t("allItems")} ({items.length})
                  </button>
                  {categories.map((cat) => {
                    const count = items.filter((i) => i.category_id === cat.id).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border
                          ${activeCategoryId === cat.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary"}`}
                      >
                        {cat.name} ({count})
                      </button>
                    );
                  })}
                  {/* Uncategorized tab */}
                  {(() => {
                    const count = items.filter((i) => !i.category_id).length;
                    if (count === 0) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => setActiveCategoryId("uncategorized")}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border
                          ${activeCategoryId === "uncategorized"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary"}`}
                      >
                        {t("uncategorized")} ({count})
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* Items list */}
              {(() => {
                const q = searchQuery.toLowerCase().trim();
                const visibleItems = items.filter((item) => {
                  // Category filter
                  if (activeCategoryId === "uncategorized" && item.category_id) return false;
                  if (activeCategoryId !== "all" && activeCategoryId !== "uncategorized" && item.category_id !== activeCategoryId) return false;
                  // Search filter
                  if (q) {
                    const name = item.name.toLowerCase();
                    const nameEn = (item.name_en || "").toLowerCase();
                    const desc = (item.description || "").toLowerCase();
                    const cat = getCategoryName(item.category_id).toLowerCase();
                    if (!name.includes(q) && !nameEn.includes(q) && !desc.includes(q) && !cat.includes(q)) return false;
                  }
                  return true;
                });

                if (visibleItems.length === 0) {
                  return <p className="text-center text-muted-foreground py-8 text-sm">{t("noMatchFilters")}</p>;
                }

                return (
                  <div className="space-y-2">
                    {visibleItems.map((item) => (
                      <div key={item.id} className={`flex items-center gap-3 rounded-lg border p-3 transition-opacity ${item.is_sold_out ? "opacity-60" : ""}`}>
                        {/* Inline photo management */}
                        <div className="relative flex-shrink-0 group">
                          <label
                            tabIndex={0}
                            onPaste={(e) => pasteImage(e, (f) => uploadItemPhoto(item, f))}
                            className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-md overflow-hidden border border-dashed hover:border-primary transition-colors focus:outline-none focus:border-primary"
                          >
                            {(itemPreviews[item.id] || item.photo_url) ? (
                              <>
                                <img src={itemPreviews[item.id] ?? item.photo_url!} alt={item.name} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-full w-full bg-muted">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/heic,image/heif"
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && uploadItemPhoto(item, e.target.files[0])}
                            />
                          </label>
                          {item.photo_url && (
                            <button
                              type="button"
                              onClick={() => removeItemPhoto(item)}
                              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors z-10"
                              title={t("removePhoto")}
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                            {item.is_sold_out && (
                              <span className="flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                                {t("soldOut")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{getCategoryName(item.category_id)} · €{Number(item.price).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title={item.is_sold_out ? t("markAvailable") : t("markSoldOut")}
                            onClick={() => toggleSoldOut(item)}
                            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors border
                              ${item.is_sold_out
                                ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                                : "bg-muted text-muted-foreground border-border hover:border-destructive hover:text-destructive"}`}
                          >
                            <ShoppingBag className="h-3 w-3" />
                            {item.is_sold_out ? t("markAvailable") : t("soldOut")}
                          </button>
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
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}