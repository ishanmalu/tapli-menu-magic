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
import { X, Languages, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { FREE_FROM_ALLERGENS, DIETARY_LIFESTYLE_TAGS } from "@/constants/menuTags";
import type { CustomTag } from "@/types/filterSettings";
import { compressImage } from "@/lib/imageUtils";
import { translate, translateBatch } from "@/lib/translate";
import { AvailabilityEditor } from "@/components/dashboard/AvailabilityEditor";
import type { AvailabilitySchedule } from "@/types/availability";
import { EXTRA_LANGUAGES, getLang } from "@/constants/languages";

interface Props {
  restaurantId: string;
  categories: Tables<"categories">[];
  item: Tables<"menu_items"> | null;
  onSave: () => void;
  onCancel: () => void;
  /** Only show these allergen tags in the form (undefined = show all) */
  activeAllergens?: string[];
  /** Only show these dietary tags in the form (undefined = show all) */
  activeDietaryTags?: string[];
  /** Custom tags defined by the restaurant manager */
  customTags?: CustomTag[];
  /** Extra language codes enabled for this restaurant (e.g. ["sv", "de"]) */
  enabledLanguages?: string[];
}

// Shape of one extra-language translation block
interface LangTranslation {
  name: string;
  description: string;
  ingredients: string;
}

export function MenuItemForm({ restaurantId, categories, item, onSave, onCancel, activeAllergens, activeDietaryTags, customTags = [], enabledLanguages = [] }: Props) {
  const { t } = useLanguage();

  // Extra languages (beyond FI + EN) that are enabled for this restaurant
  const extraLangs = EXTRA_LANGUAGES.filter((l) => enabledLanguages.includes(l.code));

  // State for extra language translations, keyed by language code
  const existingTranslations = (item?.translations as Record<string, { name?: string; description?: string; ingredients?: string[] }> | null) ?? {};
  const [extraTranslations, setExtraTranslations] = useState<Record<string, LangTranslation>>(() => {
    const init: Record<string, LangTranslation> = {};
    extraLangs.forEach((lang) => {
      const existing = existingTranslations[lang.code];
      init[lang.code] = {
        name: existing?.name ?? "",
        description: existing?.description ?? "",
        ingredients: (existing?.ingredients ?? []).join(", "),
      };
    });
    return init;
  });

  // Which extra language panels are expanded
  const [expandedLangs, setExpandedLangs] = useState<Record<string, boolean>>({});
  const [translatingLang, setTranslatingLang] = useState<Record<string, boolean>>({});
  const [name, setName] = useState(item?.name || "");
  const [nameEn, setNameEn] = useState(item?.name_en || "");
  const [description, setDescription] = useState(item?.description || "");
  const [descriptionEn, setDescriptionEn] = useState(item?.description_en || "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [categoryId, setCategoryId] = useState(item?.category_id || "");
  const [calories, setCalories] = useState(item?.calories != null ? String(item.calories) : "");
  const [protein, setProtein] = useState(item?.protein != null ? String(item.protein) : "");
  const [allergens, setAllergens] = useState<string[]>(item?.allergens || []);
  const [dietaryTags, setDietaryTags] = useState<string[]>(item?.dietary_tags || []);
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [photo, setPhoto] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [availabilitySchedule, setAvailabilitySchedule] = useState<AvailabilitySchedule | null>(
    (item?.availability_schedule as unknown as AvailabilitySchedule | null) ?? null
  );
  const [ingredientsText, setIngredientsText] = useState(
    (item?.ingredients ?? []).join(", ")
  );
  const [ingredientsTextEn, setIngredientsTextEn] = useState(
    (item?.ingredients_en ?? []).join(", ")
  );
  const [badge, setBadge] = useState<string>(item?.badge || "");
  const [submitting, setSubmitting] = useState(false);
  const [translatingName, setTranslatingName] = useState(false);
  const [translatingDesc, setTranslatingDesc] = useState(false);
  const [translatingIngredients, setTranslatingIngredients] = useState(false);
  const { toast } = useToast();

  const autoTranslate = async (
    text: string,
    from: "fi" | "en",
    to: "fi" | "en",
    setTarget: (v: string) => void,
    setLoading: (v: boolean) => void
  ) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const result = await translate(text, from, to);
      setTarget(result);
    } catch {
      toast({ title: t("translateError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Translate all fields for an extra language in one batched DeepL request
  const translateAllForLang = async (langCode: string) => {
    const sourceName = name.trim() || nameEn.trim();
    const sourceDesc = description.trim() || descriptionEn.trim();
    const sourceIngr = ingredientsText.trim() || ingredientsTextEn.trim();
    const sourceLang = name.trim() ? "fi" : "en";

    const texts = [sourceName, sourceDesc, sourceIngr].filter(Boolean);
    if (texts.length === 0) return;

    setTranslatingLang((prev) => ({ ...prev, [langCode]: true }));
    try {
      const results = await translateBatch(
        [sourceName, sourceDesc, sourceIngr],
        langCode,
        sourceLang
      );
      setExtraTranslations((prev) => ({
        ...prev,
        [langCode]: {
          name: results[0] ?? "",
          description: results[1] ?? "",
          ingredients: results[2] ?? "",
        },
      }));
      toast({ title: t("translationComplete") });
    } catch {
      toast({ title: t("translateError"), variant: "destructive" });
    } finally {
      setTranslatingLang((prev) => ({ ...prev, [langCode]: false }));
    }
  };

  // Map each tag slug to its translated display label
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
    "vegan": t("tagVegan"),
    "vegetarian": t("tagVegetarian"),
    "lactose-free": t("tagLactoseFree"),
    "plant-based": t("tagPlantBased"),
    "low-carb": t("tagLowCarb"),
    "keto": t("tagKeto"),
    "high-protein": t("tagHighProtein"),
    "no-added-sugar": t("tagNoAddedSugar"),
    "low-calorie": t("tagLowCalorie"),
    "halal": t("tagHalal"),
    "kosher": t("tagKosher"),
    "no-pork": t("tagNoPork"),
    "no-alcohol": t("tagNoAlcohol"),
    "no-beef": t("tagNoBeef"),
  };

  const pasteImage = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith("image/"));
    if (item) { e.preventDefault(); const f = item.getAsFile(); if (f) { setPhoto(f); setRemovePhoto(false); } }
  };

  const toggleAllergen = (a: string) =>
    setAllergens(allergens.includes(a) ? allergens.filter((x) => x !== a) : [...allergens, a]);
  const toggleDietary = (d: string) =>
    setDietaryTags(dietaryTags.includes(d) ? dietaryTags.filter((x) => x !== d) : [...dietaryTags, d]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let photoUrl = removePhoto ? null : (item?.photo_url || null);
      if (photo) {
        const compressed = await compressImage(photo, 800, 0.85);
        const path = `${restaurantId}/items/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("menu-photos").upload(path, compressed, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("menu-photos").getPublicUrl(path);
        photoUrl = `${publicUrl}?t=${Date.now()}`;
      }

      // Build translations JSONB for extra languages
      const translationsJson: Record<string, { name: string; description: string; ingredients: string[] }> = {};
      extraLangs.forEach((lang) => {
        const tr = extraTranslations[lang.code];
        if (tr?.name || tr?.description || tr?.ingredients) {
          translationsJson[lang.code] = {
            name: tr.name ?? "",
            description: tr.description ?? "",
            ingredients: tr.ingredients ? tr.ingredients.split(",").map((s) => s.trim()).filter(Boolean) : [],
          };
        }
      });

      const payload = {
        name: name.trim(),
        name_en: nameEn.trim() || null,
        description: description.trim() || null,
        description_en: descriptionEn.trim() || null,
        price: parseFloat(price),
        category_id: categoryId || null,
        calories: calories ? parseInt(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        allergens,
        dietary_tags: dietaryTags,
        ingredients: ingredientsText.trim()
          ? ingredientsText.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        ingredients_en: ingredientsTextEn.trim()
          ? ingredientsTextEn.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        translations: translationsJson,
        is_available: isAvailable,
        availability_schedule: availabilitySchedule as any,
        photo_url: photoUrl,
        badge: badge || null,
        restaurant_id: restaurantId,
      };

      const { error } = item
        ? await supabase.from("menu_items").update(payload).eq("id", item.id)
        : await supabase.from("menu_items").insert(payload);

      if (error) throw error;
      onSave();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name FI + EN with translate buttons */}
      <div className="space-y-1.5">
        <Label>{t("name")} * <span className="text-muted-foreground font-normal text-xs">(FI)</span></Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={translatingName || !name.trim()}
            onClick={() => autoTranslate(name, "fi", "en", setNameEn, setTranslatingName)}
            className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Languages className="h-3 w-3" />
            {translatingName ? t("translating") : t("translateToEn")}
          </button>
          {nameEn && (
            <button
              type="button"
              disabled={translatingName || !nameEn.trim()}
              onClick={() => autoTranslate(nameEn, "en", "fi", setName, setTranslatingName)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Languages className="h-3 w-3" />
              {t("translateToFi")}
            </button>
          )}
        </div>
        <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder={t("englishTranslation")} />
      </div>

      {/* Description FI + EN with translate buttons */}
      <div className="space-y-1.5">
        <Label>{t("description")} <span className="text-muted-foreground font-normal text-xs">(FI)</span></Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={translatingDesc || !description.trim()}
            onClick={() => autoTranslate(description, "fi", "en", setDescriptionEn, setTranslatingDesc)}
            className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Languages className="h-3 w-3" />
            {translatingDesc ? t("translating") : t("translateToEn")}
          </button>
          {descriptionEn && (
            <button
              type="button"
              disabled={translatingDesc || !descriptionEn.trim()}
              onClick={() => autoTranslate(descriptionEn, "en", "fi", setDescription, setTranslatingDesc)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Languages className="h-3 w-3" />
              {t("translateToFi")}
            </button>
          )}
        </div>
        <Textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows={2} placeholder={t("englishTranslation")} />
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
      <div className="space-y-1.5">
        <Label>{t("ingredients")} <span className="text-muted-foreground font-normal text-xs">(FI)</span></Label>
        <p className="text-xs text-muted-foreground">{t("ingredientsHint")}</p>
        <Textarea
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          placeholder={t("ingredientsPlaceholder")}
          rows={2}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={translatingIngredients || !ingredientsText.trim()}
            onClick={() => autoTranslate(ingredientsText, "fi", "en", setIngredientsTextEn, setTranslatingIngredients)}
            className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Languages className="h-3 w-3" />
            {translatingIngredients ? t("translating") : t("translateToEn")}
          </button>
          {ingredientsTextEn && (
            <button
              type="button"
              disabled={translatingIngredients || !ingredientsTextEn.trim()}
              onClick={() => autoTranslate(ingredientsTextEn, "en", "fi", setIngredientsText, setTranslatingIngredients)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Languages className="h-3 w-3" />
              {t("translateToFi")}
            </button>
          )}
        </div>
        <Textarea
          value={ingredientsTextEn}
          onChange={(e) => setIngredientsTextEn(e.target.value)}
          placeholder={t("ingredientsPlaceholderEn")}
          rows={2}
        />
      </div>
      {/* ── Extra language translations ── */}
      {extraLangs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 pt-1">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Additional Languages</Label>
          </div>
          {extraLangs.map((lang) => {
            const tr = extraTranslations[lang.code] ?? { name: "", description: "", ingredients: "" };
            const isExpanded = expandedLangs[lang.code] ?? false;
            const isTranslating = translatingLang[lang.code] ?? false;
            const hasContent = tr.name || tr.description || tr.ingredients;
            return (
              <div key={lang.code} className="rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <button
                  type="button"
                  onClick={() => setExpandedLangs((prev) => ({ ...prev, [lang.code]: !isExpanded }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{lang.flag}</span>
                    <span className="text-sm font-medium text-foreground">{lang.label}</span>
                    {hasContent && (
                      <span className="text-xs bg-green-500/15 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                        Translated
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {/* Content */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isTranslating || (!name.trim() && !nameEn.trim())}
                      onClick={() => translateAllForLang(lang.code)}
                      className="gap-1.5 w-full"
                    >
                      {isTranslating
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("translatingAll")}</>
                        : <><Languages className="h-3.5 w-3.5" /> {t("translateAllDeepL")} ({lang.nativeName})</>
                      }
                    </Button>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Name ({lang.label})</Label>
                      <Input
                        value={tr.name}
                        onChange={(e) => setExtraTranslations((prev) => ({ ...prev, [lang.code]: { ...tr, name: e.target.value } }))}
                        placeholder={`${lang.nativeName}…`}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Description ({lang.label})</Label>
                      <Textarea
                        value={tr.description}
                        onChange={(e) => setExtraTranslations((prev) => ({ ...prev, [lang.code]: { ...tr, description: e.target.value } }))}
                        placeholder={`${lang.nativeName}…`}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Ingredients ({lang.label})</Label>
                      <Textarea
                        value={tr.ingredients}
                        onChange={(e) => setExtraTranslations((prev) => ({ ...prev, [lang.code]: { ...tr, ingredients: e.target.value } }))}
                        placeholder="comma separated…"
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div>
        <Label>{t("photo")}</Label>
        {item?.photo_url && !photo && !removePhoto ? (
          <div
            tabIndex={0}
            onPaste={pasteImage}
            className="flex items-center gap-3 mt-1 p-2 rounded-lg border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <img src={item.photo_url} alt={item.name} className="h-14 w-14 rounded-md object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{t("currentPhoto")}</p>
              <label className="text-xs text-primary hover:underline cursor-pointer">
                {t("changePhoto")}
                <input type="file" accept="image/png,image/jpeg,image/heic,image/heif" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              </label>
              <p className="text-xs text-muted-foreground/60">{t("pasteHint")}</p>
            </div>
            <button
              type="button"
              onClick={() => setRemovePhoto(true)}
              className="flex items-center gap-1 text-xs text-destructive hover:underline flex-shrink-0"
            >
              <X className="h-3 w-3" /> {t("removePhoto")}
            </button>
          </div>
        ) : (
          <>
            {removePhoto && (
              <p className="text-xs text-muted-foreground mb-1">
                {t("photoWillBeRemoved")}{" "}
                <button type="button" onClick={() => setRemovePhoto(false)} className="text-primary hover:underline">{t("undo")}</button>
              </p>
            )}
            {!removePhoto && (
              <label
                tabIndex={0}
                onPaste={pasteImage}
                className="flex flex-col items-center justify-center gap-1 w-full rounded-lg border-2 border-dashed p-4 cursor-pointer hover:border-primary transition-colors focus:outline-none focus:border-primary mt-1"
              >
                <Input type="file" accept="image/png,image/jpeg,image/heic,image/heif" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                {photo ? (
                  <img src={URL.createObjectURL(photo)} alt="preview" className="h-20 w-20 rounded-md object-cover" />
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{t("photo")}</p>
                    <p className="text-xs text-muted-foreground/60">{t("pasteHint")}</p>
                  </>
                )}
              </label>
            )}
          </>
        )}
      </div>
      {/* Free From section */}
      {(() => {
        const builtIn = activeAllergens
          ? FREE_FROM_ALLERGENS.filter((a) => activeAllergens.includes(a))
          : [...FREE_FROM_ALLERGENS];
        const custom = customTags.filter((ct) => ct.type === "allergen");
        if (builtIn.length === 0 && custom.length === 0) return null;
        return (
          <div>
            <Label>{t("freeFrom")}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {builtIn.map((a) => (
                <Badge key={a} variant={allergens.includes(a) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleAllergen(a)}>
                  {tagLabels[a] || a}
                </Badge>
              ))}
              {custom.map((ct) => (
                <Badge key={ct.id} variant={allergens.includes(ct.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleAllergen(ct.id)}>
                  {ct.label}
                </Badge>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Dietary & Lifestyle section */}
      {(() => {
        const builtIn = activeDietaryTags
          ? DIETARY_LIFESTYLE_TAGS.filter((d) => activeDietaryTags.includes(d))
          : [...DIETARY_LIFESTYLE_TAGS];
        const custom = customTags.filter((ct) => ct.type === "dietary");
        if (builtIn.length === 0 && custom.length === 0) return null;
        return (
          <div>
            <Label>{t("dietaryAndLifestyle")}</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {builtIn.map((d) => (
                <Badge key={d} variant={dietaryTags.includes(d) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleDietary(d)}>
                  {tagLabels[d] || d}
                </Badge>
              ))}
              {custom.map((ct) => (
                <Badge key={ct.id} variant={dietaryTags.includes(ct.id) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleDietary(ct.id)}>
                  {ct.label}
                </Badge>
              ))}
            </div>
          </div>
        );
      })()}
      <div className="flex items-center gap-2">
        <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
        <Label>{t("available")}</Label>
      </div>

      <AvailabilityEditor value={availabilitySchedule} onChange={setAvailabilitySchedule} />

      {/* Badge */}
      <div className="space-y-1.5">
        <Label>{t("badgeLabel")}</Label>
        <Select value={badge} onValueChange={setBadge}>
          <SelectTrigger>
            <SelectValue placeholder={t("badgeNone")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("badgeNone")}</SelectItem>
            <SelectItem value="bestseller">★ {t("badgeBestseller")}</SelectItem>
            <SelectItem value="new">✦ {t("badgeNew")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? t("saving") : item ? t("update") : t("addItem")}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}