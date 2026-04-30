import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MenuItemForm } from "@/components/dashboard/MenuItemForm";
import { CategoryManager } from "@/components/dashboard/CategoryManager";
import { RestaurantInfoEditor } from "@/components/dashboard/RestaurantInfoEditor";
import { FilterSettingsEditor } from "@/components/dashboard/FilterSettingsEditor";
import { FoodStyleSettings } from "@/components/dashboard/FoodStyleSettings";
import { TagSettings } from "@/components/dashboard/TagSettings";
import { QRCodeCard } from "@/components/dashboard/QRCodeCard";
import {
  Plus, Pencil, Trash2, ImageIcon, X, Search,
  Undo2, Redo2, FolderInput, GripVertical, Copy,
  Eye, ChevronDown, SlidersHorizontal, ArrowUpDown,
  ChevronLeft, ChevronRight, Rocket,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { compressImage, localPreview } from "@/lib/imageUtils";
import { trackSoldOutToggled, trackPhotoUploaded } from "@/lib/posthog";
import { SettingsSection } from "@/components/dashboard/SettingsSection";
import { CustomizeSection } from "@/components/dashboard/CustomizeSection";
import type { DashboardSection } from "@/pages/Dashboard";

type MenuItem = Tables<"menu_items">;
type Category = Tables<"categories">;
type SortKey = "default" | "name_asc" | "name_desc" | "price_asc" | "price_desc";
type StatusFilter = "all" | "available" | "sold_out";

interface Props {
  restaurant: Tables<"restaurants">;
  onRestaurantUpdate: (r: Tables<"restaurants">) => void;
  activeSection: DashboardSection;
  onShowDeleteAccount?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Section wrapper — consistent header + padded content                        */
/* ─────────────────────────────────────────────────────────────────────────── */
function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="px-6 py-5 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
export function MenuManager({
  restaurant,
  onRestaurantUpdate,
  activeSection,
  onShowDeleteAccount,
}: Props) {
  const { t } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  /* filters & search */
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("default");

  /* pagination */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* undo / redo */
  const [undoStack, setUndoStack] = useState<MenuItem[][]>([]);
  const [redoStack, setRedoStack] = useState<MenuItem[][]>([]);

  /* bulk */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");

  /* restaurant branding */
  const fs = restaurant.filter_settings as any;
  const [bannerBlur, setBannerBlur] = useState<number>(fs?.bannerBlur ?? 0);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [itemPreviews, setItemPreviews] = useState<Record<string, string>>({});

  const { toast } = useToast();

  /* ── helpers ───────────────────────────────────────────────────────────── */
  const pasteImage = (e: React.ClipboardEvent, fn: (file: File) => void) => {
    const it = Array.from(e.clipboardData?.items ?? []).find((i) =>
      i.type.startsWith("image/")
    );
    if (it) { e.preventDefault(); const f = it.getAsFile(); if (f) fn(f); }
  };

  const getCategoryName = (catId: string | null) =>
    categories.find((c) => c.id === catId)?.name || t("uncategorized");

  /* ── data loading ──────────────────────────────────────────────────────── */
  const loadData = async () => {
    try {
      const [{ data: cats, error: catsError }, { data: menuItems, error: itemsError }] =
        await Promise.all([
          supabase
            .from("categories")
            .select("*")
            .eq("restaurant_id", restaurant.id)
            .order("sort_order"),
          supabase
            .from("menu_items")
            .select("*")
            .eq("restaurant_id", restaurant.id)
            .order("sort_order"),
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

  /* reset page on filter changes */
  useEffect(() => { setPage(1); }, [searchQuery, activeCategoryId, statusFilter, sortKey]);

  /* ── undo / redo ───────────────────────────────────────────────────────── */
  const pushUndo = (deleted: MenuItem[]) => {
    setUndoStack((prev) => [...prev.slice(-19), deleted]);
    setRedoStack([]);
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const deleted = undoStack[undoStack.length - 1];
    try {
      const { error } = await supabase.from("menu_items").upsert(deleted);
      if (error) throw error;
      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, deleted]);
      await loadData();
      toast({ title: t("undoSuccess") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const toDelete = redoStack[redoStack.length - 1];
    try {
      const ids = toDelete.map((i) => i.id);
      const { error } = await supabase.from("menu_items").delete().in("id", ids);
      if (error) throw error;
      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => [...prev, toDelete]);
      setItems((prev) => prev.filter((i) => !ids.includes(i.id)));
      toast({ title: t("redoSuccess") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  /* ── CRUD ──────────────────────────────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
      pushUndo([item]);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleDuplicate = async (item: MenuItem) => {
    try {
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = item;
      const { error } = await supabase.from("menu_items").insert({
        ...rest,
        name: `${item.name} (copy)`,
        sort_order: items.length,
      });
      if (error) throw error;
      await loadData();
      toast({ title: t("itemDuplicated") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleClearMenu = async () => {
    if (items.length === 0) return;
    const snapshot = [...items];
    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("restaurant_id", restaurant.id);
      if (error) throw error;
      pushUndo(snapshot);
      setItems([]);
      toast({ title: t("menuCleared") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingItem(null);
    loadData();
  };

  const toggleSoldOut = async (item: MenuItem) => {
    try {
      const next = !item.is_sold_out;
      const { error } = await supabase
        .from("menu_items")
        .update({ is_sold_out: next })
        .eq("id", item.id);
      if (error) throw error;
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_sold_out: next } : i))
      );
      trackSoldOutToggled({ itemId: item.id, itemName: item.name, soldOut: next });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  /* ── bulk assign ───────────────────────────────────────────────────────── */
  const toggleSelectItem = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleBulkAssign = async () => {
    if (selectedIds.size === 0 || !bulkCategoryId) return;
    const ids = Array.from(selectedIds);
    const catId = bulkCategoryId === "__none__" ? null : bulkCategoryId;
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ category_id: catId })
        .in("id", ids);
      if (error) throw error;
      setItems((prev) =>
        prev.map((i) => (selectedIds.has(i.id) ? { ...i, category_id: catId } : i))
      );
      setSelectedIds(new Set());
      setBulkCategoryId("");
      toast({ title: t("bulkAssigned") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  /* ── image uploads ─────────────────────────────────────────────────────── */
  const uploadRestaurantImage = async (file: File, type: "logo" | "cover") => {
    const preview = localPreview(file);
    if (type === "logo") setLogoPreview(preview); else setCoverPreview(preview);
    try {
      const maxWidth = type === "logo" ? 400 : 1600;
      const quality = type === "logo" ? 0.88 : 0.85;
      const compressed = await compressImage(file, maxWidth, quality);
      const path = `${restaurant.id}/${type}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("menu-photos")
        .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("menu-photos")
        .getPublicUrl(path);
      const freshUrl = `${publicUrl}?t=${Date.now()}`;
      const payload = type === "logo"
        ? { logo_url: freshUrl }
        : { cover_photo_url: freshUrl };
      const { data, error } = await supabase
        .from("restaurants")
        .update(payload)
        .eq("id", restaurant.id)
        .select()
        .single();
      if (error) throw error;
      if (data) onRestaurantUpdate(data);
      trackPhotoUploaded({ type });
    } catch (err: any) {
      toast({ title: t("uploadError"), description: err.message, variant: "destructive" });
    } finally {
      if (type === "logo") setLogoPreview(null); else setCoverPreview(null);
      URL.revokeObjectURL(preview);
    }
  };

  const removeRestaurantImage = async (type: "logo" | "cover") => {
    try {
      const payload = type === "logo" ? { logo_url: null } : { cover_photo_url: null };
      const { data, error } = await supabase
        .from("restaurants")
        .update(payload)
        .eq("id", restaurant.id)
        .select()
        .single();
      if (error) throw error;
      if (data) onRestaurantUpdate(data);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const uploadItemPhoto = async (item: MenuItem, file: File) => {
    const preview = localPreview(file);
    setItemPreviews((p) => ({ ...p, [item.id]: preview }));
    try {
      const compressed = await compressImage(file, 800, 0.85);
      const path = `${restaurant.id}/items/${item.id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("menu-photos")
        .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("menu-photos")
        .getPublicUrl(path);
      const freshUrl = `${publicUrl}?t=${Date.now()}`;
      const { error } = await supabase
        .from("menu_items")
        .update({ photo_url: freshUrl })
        .eq("id", item.id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      toast({ title: t("uploadError"), description: err.message, variant: "destructive" });
    } finally {
      setItemPreviews((p) => { const n = { ...p }; delete n[item.id]; return n; });
      URL.revokeObjectURL(preview);
    }
  };

  const removeItemPhoto = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ photo_url: null })
        .eq("id", item.id);
      if (error) throw error;
      loadData();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* Section rendering                                                       */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /* ── Categories ─────────────────────────────────────────────────────── */
  if (activeSection === "categories") {
    return (
      <SectionShell title={t("categories")}>
        <CategoryManager
          restaurantId={restaurant.id}
          categories={categories}
          onUpdate={loadData}
        />
      </SectionShell>
    );
  }

  /* ── Tags & Filters ─────────────────────────────────────────────────── */
  if (activeSection === "tags") {
    return (
      <SectionShell title={t("tagsAndFilters")}>
        <FoodStyleSettings restaurant={restaurant} onUpdate={onRestaurantUpdate} />
        <TagSettings restaurant={restaurant} onUpdate={onRestaurantUpdate} />
        <FilterSettingsEditor restaurant={restaurant} onUpdate={onRestaurantUpdate} />
      </SectionShell>
    );
  }

  /* ── Restaurant ─────────────────────────────────────────────────────── */
  if (activeSection === "restaurant") {
    return (
      <SectionShell title={t("restaurantInfo")}>
        <RestaurantInfoEditor restaurant={restaurant} onUpdate={onRestaurantUpdate} />

        {/* Branding */}
        <div className="rounded-xl border border-border p-5 space-y-5 bg-card">
          <h2 className="text-base font-semibold text-foreground">{t("restaurantBranding")}</h2>

          {/* Logo */}
          <div className="flex gap-4 items-start">
            <div className="relative shrink-0">
              <label
                tabIndex={0}
                onPaste={(e) => pasteImage(e, (f) => uploadRestaurantImage(f, "logo"))}
                className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed hover:border-primary transition-colors overflow-hidden focus:outline-none focus:border-primary"
              >
                {(logoPreview || restaurant.logo_url) ? (
                  <img
                    src={logoPreview ?? restaurant.logo_url!}
                    alt={t("logoAlt")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/heic,image/heif"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadRestaurantImage(e.target.files[0], "logo")}
                />
              </label>
              {restaurant.logo_url && (
                <button
                  type="button"
                  onClick={() => removeRestaurantImage("logo")}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
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
            </div>
          </div>

          {/* Cover */}
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
                    <img
                      src={coverPreview ?? restaurant.cover_photo_url!}
                      alt={t("coverAlt")}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{t("changeCover")}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-1 px-4">
                    <ImageIcon className="h-7 w-7 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">{t("uploadCover")}</p>
                    <p className="text-xs text-muted-foreground">{t("coverRecommended")}</p>
                    <p className="text-xs text-muted-foreground/60">{t("pasteHint")}</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/heic,image/heif"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadRestaurantImage(e.target.files[0], "cover")}
                />
              </label>
              {restaurant.cover_photo_url && (
                <button
                  type="button"
                  onClick={() => removeRestaurantImage("cover")}
                  className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 z-10"
                >
                  <X className="h-3 w-3" /> {t("removePhoto")}
                </button>
              )}
            </div>
          </div>

          {/* Banner blur */}
          {restaurant.cover_photo_url && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{t("bannerBlur")}</p>
                <span className="text-xs text-muted-foreground">{bannerBlur}%</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("bannerBlurDesc")}</p>
              <Slider
                min={0} max={100} step={5}
                value={[bannerBlur]}
                onValueChange={([v]) => { setBannerBlur(v); saveBannerBlur(v); }}
              />
            </div>
          )}
        </div>
      </SectionShell>
    );
  }

  /* ── Customize ──────────────────────────────────────────────────────── */
  if (activeSection === "customize") {
    return (
      <CustomizeSection
        restaurant={restaurant}
        onRestaurantUpdate={onRestaurantUpdate}
      />
    );
  }

  /* ── QR Code ────────────────────────────────────────────────────────── */
  if (activeSection === "qr") {
    return (
      <SectionShell title={t("qrCode")} description={t("qrCodeDesc")}>
        <QRCodeCard restaurant={restaurant} />
      </SectionShell>
    );
  }

  /* ── Settings ───────────────────────────────────────────────────────── */
  if (activeSection === "settings") {
    return (
      <SettingsSection
        restaurant={restaurant}
        onRestaurantUpdate={onRestaurantUpdate}
        onShowDeleteAccount={onShowDeleteAccount}
      />
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* ── Menu Items section (main table view) ────────────────────────────── */
  /* ═══════════════════════════════════════════════════════════════════════ */

  /* Build sorted + filtered list */
  const sortedItems = [...items].sort((a, b) => {
    switch (sortKey) {
      case "name_asc":   return a.name.localeCompare(b.name);
      case "name_desc":  return b.name.localeCompare(a.name);
      case "price_asc":  return Number(a.price) - Number(b.price);
      case "price_desc": return Number(b.price) - Number(a.price);
      default:           return a.sort_order - b.sort_order;
    }
  });

  const q = searchQuery.toLowerCase().trim();
  const visibleItems = sortedItems.filter((item) => {
    if (activeCategoryId === "uncategorized" && item.category_id) return false;
    if (activeCategoryId !== "all" && activeCategoryId !== "uncategorized" && item.category_id !== activeCategoryId) return false;
    if (statusFilter === "available" && item.is_sold_out) return false;
    if (statusFilter === "sold_out" && !item.is_sold_out) return false;
    if (q) {
      const name = item.name.toLowerCase();
      const nameEn = (item.name_en || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const cat = getCategoryName(item.category_id).toLowerCase();
      if (!name.includes(q) && !nameEn.includes(q) && !desc.includes(q) && !cat.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = visibleItems.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allVisibleSelected = paginatedItems.length > 0 && paginatedItems.every((i) => selectedIds.has(i.id));

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (q ? 1 : 0);

  const sortLabels: Record<SortKey, string> = {
    default:    t("sortBtn"),
    name_asc:   t("sortNameAZ"),
    name_desc:  t("sortNameZA"),
    price_asc:  t("sortPriceLow"),
    price_desc: t("sortPriceHigh"),
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ── */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 bg-card/50">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">{t("menuItems")}</h1>
          <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <Button
            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
            onClick={handleUndo} disabled={undoStack.length === 0}
            title={t("undo")}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
            onClick={handleRedo} disabled={redoStack.length === 0}
            title={t("redo")}
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          {/* Preview Menu */}
          <a
            href={`/menu/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <Eye className="h-4 w-4" />
              {t("previewMenu")}
            </Button>
          </a>

          {/* Publish Menu dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5 h-9">
                <Rocket className="h-4 w-4" />
                {t("publishMenu")}
                <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <a href={`/menu/${restaurant.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> {t("viewMenu")}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/menu/${restaurant.slug}`);
                  toast({ title: t("copyMenuLink") });
                }}
              >
                <Copy className="h-4 w-4 mr-2" /> {t("copyMenuLink")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Category filter tabs ── */}
      <div className="border-b border-border px-6 py-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* All */}
        <button
          type="button"
          onClick={() => { setActiveCategoryId("all"); setSelectedIds(new Set()); }}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border
            ${activeCategoryId === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"}`}
        >
          {t("allItems")} <span className="ml-1 opacity-70">{items.length}</span>
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.category_id === cat.id).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setActiveCategoryId(cat.id); setSelectedIds(new Set()); }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border
                ${activeCategoryId === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"}`}
            >
              {cat.name} <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })}
        {(() => {
          const count = items.filter((i) => !i.category_id).length;
          if (count === 0) return null;
          return (
            <button
              type="button"
              onClick={() => { setActiveCategoryId("uncategorized"); setSelectedIds(new Set()); }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border
                ${activeCategoryId === "uncategorized"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"}`}
            >
              {t("uncategorized")} <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })()}
      </div>

      {/* ── Search + filter bar ── */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchItems")}
            className="pl-9 h-9 bg-muted/40 border-border text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {statusFilter !== "all" && (
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
            {statusFilter === "available" ? t("statusAvailable") : t("statusSoldOut")}
            <button type="button" onClick={() => setStatusFilter("all")} className="ml-0.5 hover:text-primary/70">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9 relative">
                <SlidersHorizontal className="h-4 w-4" />
                {t("filterBtn")}
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")} className={statusFilter === "all" ? "font-semibold" : ""}>
                {t("statusAll")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("available")} className={statusFilter === "available" ? "font-semibold" : ""}>
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2 shrink-0" />
                {t("available")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("sold_out")} className={statusFilter === "sold_out" ? "font-semibold" : ""}>
                <span className="h-2 w-2 rounded-full bg-muted-foreground mr-2 shrink-0" />
                {t("soldOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <ArrowUpDown className="h-4 w-4" />
                {sortKey === "default" ? t("sortBtn") : sortLabels[sortKey]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setSortKey("default")}>Default order</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortKey("name_asc")}>{t("sortNameAZ")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortKey("name_desc")}>{t("sortNameZA")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortKey("price_asc")}>{t("sortPriceLow")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortKey("price_desc")}>{t("sortPriceHigh")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Item */}
          <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingItem(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-9">
                <Plus className="h-4 w-4" /> {t("addItem")}
              </Button>
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
                activeAllergens={(restaurant.filter_settings as any)?.activeAllergens}
                activeDietaryTags={(restaurant.filter_settings as any)?.activeDietaryTags}
                customTags={(restaurant.filter_settings as any)?.customTags}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Bulk action bar ── */}
      {categories.length > 0 && selectedIds.size > 0 && (
        <div className="px-6 py-2.5 border-b border-primary/20 bg-primary/5 flex items-center gap-3">
          <FolderInput className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-primary shrink-0">
            {selectedIds.size} {t("itemsSelected")}
          </span>
          <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
            <SelectTrigger className="h-8 flex-1 max-w-xs text-sm">
              <SelectValue placeholder={t("assignToCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("uncategorized")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkAssign} disabled={!bulkCategoryId} className="h-8">
            {t("assign")}
          </Button>
          <Button
            variant="ghost" size="icon" className="h-8 w-8 shrink-0"
            onClick={() => { setSelectedIds(new Set()); setBulkCategoryId(""); }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-muted-foreground">{t("noItemsYet")}</p>
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingItem(null); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> {t("addItem")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("addMenuItem")}</DialogTitle>
                </DialogHeader>
                <MenuItemForm
                  restaurantId={restaurant.id}
                  categories={categories}
                  item={null}
                  onSave={handleSave}
                  onCancel={() => setShowForm(false)}
                  activeAllergens={(restaurant.filter_settings as any)?.activeAllergens}
                  activeDietaryTags={(restaurant.filter_settings as any)?.activeDietaryTags}
                  customTags={(restaurant.filter_settings as any)?.customTags}
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-10 px-3 py-3 text-left">
                  {categories.length > 0 && (
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          paginatedItems.forEach((i) => checked ? next.add(i.id) : next.delete(i.id));
                          return next;
                        });
                      }}
                    />
                  )}
                </th>
                <th className="w-8 px-2 py-3" />
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Name
                </th>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide w-36">
                  {t("categories")}
                </th>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide w-24">
                  Price
                </th>
                <th className="px-3 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide w-40">
                  Status
                </th>
                <th className="px-3 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wide w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const badgeTags = [
                  ...(item.dietary_tags ?? []).slice(0, 1),
                  ...(item.allergens ?? []).slice(0, 1),
                ].slice(0, 2);

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-border/50 transition-colors hover:bg-muted/20
                      ${selectedIds.has(item.id) ? "bg-primary/5" : ""}
                      ${item.is_sold_out ? "opacity-60" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      {categories.length > 0 && (
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={(checked) => toggleSelectItem(item.id, !!checked)}
                        />
                      )}
                    </td>

                    {/* Drag handle */}
                    <td className="px-2 py-3 text-muted-foreground/40">
                      <GripVertical className="h-4 w-4" />
                    </td>

                    {/* Name + photo + tags */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {/* Photo */}
                        <div className="relative shrink-0 group">
                          <label
                            tabIndex={0}
                            onPaste={(e) => pasteImage(e, (f) => uploadItemPhoto(item, f))}
                            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg overflow-hidden border border-border/50 hover:border-primary transition-colors focus:outline-none"
                          >
                            {(itemPreviews[item.id] || item.photo_url) ? (
                              <>
                                <img
                                  src={itemPreviews[item.id] ?? item.photo_url!}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                  <ImageIcon className="h-4 w-4 text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-full w-full bg-muted">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
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
                              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                              title={t("removePhoto")}
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>

                        {/* Name + subtitle + tags */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-foreground truncate">{item.name}</span>
                            {badgeTags.map((tag) => (
                              <span
                                key={tag}
                                className="shrink-0 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize"
                              >
                                {tag.replace(/-/g, " ")}
                              </span>
                            ))}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3">
                      {item.category_id ? (
                        <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground border border-border/50">
                          {getCategoryName(item.category_id)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-3 py-3">
                      <span className="font-semibold text-foreground">
                        €{Number(item.price).toFixed(2)}
                      </span>
                    </td>

                    {/* Status + toggle */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${item.is_sold_out ? "bg-muted-foreground" : "bg-green-500"}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.is_sold_out ? t("soldOut") : t("available")}
                        </span>
                        <Switch
                          checked={!item.is_sold_out}
                          onCheckedChange={() => toggleSoldOut(item)}
                          className="ml-1"
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title={t("duplicateItem")}
                          onClick={() => handleDuplicate(item)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditingItem(item); setShowForm(true); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("deleteItem")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("deleteItemDesc")}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(item.id)}
                              >
                                {t("delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {items.length > 0 && (
        <div className="shrink-0 border-t border-border px-6 py-3 flex items-center justify-between gap-4 bg-card/50">
          {/* Showing X to Y of Z */}
          <p className="text-sm text-muted-foreground shrink-0">
            {t("showingItems")}{" "}
            <span className="font-medium text-foreground">
              {visibleItems.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
            </span>
            {" "}to{" "}
            <span className="font-medium text-foreground">
              {Math.min(safePage * pageSize, visibleItems.length)}
            </span>
            {" "}{t("of")}{" "}
            <span className="font-medium text-foreground">{visibleItems.length}</span>
          </p>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={safePage === p ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8 text-sm"
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Items per page */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground">{t("itemsPerPage")}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
            >
              <SelectTrigger className="h-8 w-20 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Clear menu (danger zone, below pagination) */}
      {items.length > 0 && (
        <div className="shrink-0 border-t border-border px-6 py-3 flex justify-end bg-card/30">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-destructive/60 hover:text-destructive hover:bg-destructive/10">
                {t("clearMenu")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("clearMenuConfirm")}</AlertDialogTitle>
                <AlertDialogDescription>{t("clearMenuConfirmDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleClearMenu}
                >
                  {t("clearMenu")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
