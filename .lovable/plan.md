## Goal

Restyle the dashboard with a left sidebar + sectioned layout matching the reference. Keep all existing features. Use existing B&W color tokens (no purple). Keep `LanguageToggle` and `ThemeToggle`.

**All counts are computed dynamically from the live data** (Supabase `menu_items` + `categories` for the current restaurant). Numbers in the reference image (`30 items`, `Starters (6)`, etc.) are illustrative only.

## Sidebar nav

Built with shadcn `Sidebar` (`collapsible="icon"`). Header: theme-aware Tapli logo + restaurant name + "Menu Manager" subtitle.

Items:
1. **Menu Items** (`UtensilsCrossed`)
2. **Categories** (`FolderTree`)
3. **Tags & Filters** (`Tags`) — `TagSettings` (Free From & Dietary Tags) + `FoodStyleSettings` (food-style chips with sliders) + `FilterSettingsEditor` (custom filter sliders), stacked
4. **Settings** (`Settings`) — `RestaurantInfoEditor` + branding card (logo / cover / banner blur) + `QRCodeCard` + delete-account button

Active nav item: `bg-sidebar-accent text-foreground`. Inactive: `text-muted-foreground hover:text-foreground`. Mobile: default offcanvas Sheet; `SidebarTrigger` lives in the top bar so it's always visible.

State: `activeSection` is a `useState` in `Dashboard.tsx` (no new routes).

## Top bar (inside main area)

Per-section header bar with:
- Left: `SidebarTrigger` + section title + (Menu Items only) item-count badge `{items.length} items` from live state.
- Right: **Preview Menu** (`Eye` icon, opens `/menu/<slug>` new tab) · **Publish Menu** (`Rocket` icon — opens info dialog: "Your menu is live at /menu/<slug>" + Copy-link action; menu is already live so no real publish flow) · `LanguageToggle` · `ThemeToggle` · sign-out.

## Menu Items section additions

Above the existing items list:
- **Category pill tabs**: `All ({items.length})` + one pill per category showing `{cat.name} ({items.filter(i => i.category_id === cat.id).length})` + `Uncategorized ({items.filter(i => !i.category_id).length})` if > 0. All counts read from live state — never hardcoded. (This already exists in `MenuManager`; keep as-is, ensure it sits at the top.)
- **Search** (existing) on the left.
- **Filter** button (`Button variant="outline"` + `Filter` icon) → `Popover` with checkboxes: Status (Available / Sold out), Has photo (yes / no), Category multi-select. Client-side.
- **Sort** button (`Button variant="outline"` + `ArrowUpDown` icon) → `DropdownMenu`: Name A→Z, Name Z→A, Price low→high, Price high→low, Newest, Oldest. Client-side.
- **+ Add Item** primary button (existing).

Row visuals stay as they are. No inline-edit, no drag, no pagination.

## Files

**New**
- `src/components/dashboard/DashboardSidebar.tsx` — shadcn `Sidebar`, controlled by `activeSection` + `onSectionChange`.
- `src/components/dashboard/DashboardTopBar.tsx` — `SidebarTrigger`, title, optional count badge, Preview Menu, Publish Menu (info dialog), Language, Theme, sign-out.
- `src/components/dashboard/sections/MenuItemsSection.tsx` — wraps the existing menu-items list + new Filter popover + Sort dropdown. Reuses all existing CRUD handlers.
- `src/components/dashboard/sections/CategoriesSection.tsx` — renders `<CategoryManager>`.
- `src/components/dashboard/sections/TagsFiltersSection.tsx` — renders `<TagSettings>`, `<FoodStyleSettings>`, `<FilterSettingsEditor>`.
- `src/components/dashboard/sections/SettingsSection.tsx` — `<RestaurantInfoEditor>`, branding card (extracted from current `MenuManager`), `<QRCodeCard>`, delete-account button + dialog (moved from `Dashboard.tsx`).

**Modified**
- `src/pages/Dashboard.tsx` — replace current header + `<MenuManager>` mount with `<SidebarProvider>` → `<DashboardSidebar>` + main area containing `<DashboardTopBar>` and the active section. Auth/loading unchanged.
- `src/components/dashboard/MenuManager.tsx` — split as described; deleted afterwards if no remaining importers.
- `src/contexts/LanguageContext.tsx` — add EN + FI keys: `navMenuItems`, `navCategories`, `navTagsFilters`, `navSettings`, `menuManager`, `previewMenu`, `publishMenu`, `publishMenuInfo`, `copyLink`, `linkCopied`, `itemsCount`, `filter`, `sort`, `sortNameAsc`, `sortNameDesc`, `sortPriceAsc`, `sortPriceDesc`, `sortNewest`, `sortOldest`, `filterByStatus`, `filterAvailable`, `filterSoldOut`, `filterHasPhoto`, `filterByCategory`, `clearFilters`.

**Untouched**
- All Supabase calls, RLS, auth, customer menu, pricing/upgrade pages.
- `LanguageToggle`, `ThemeToggle`, color tokens, Inter font.
- Inner card visuals of `CategoryManager`, `TagSettings`, `FoodStyleSettings`, `FilterSettingsEditor`, `RestaurantInfoEditor`, `QRCodeCard`, `MenuItemForm`.

## Preview before push

Lovable's right-hand preview pane updates live as soon as I write the files — that is your preview. Nothing reaches the public `.lovable.app` URL until you click **Publish** yourself.

## Layout sketch

```text
┌────────────┬──────────────────────────────────────────────┐
│ ▣  Tapli   │ ☰  Menu Items  [{items.length} items]        │
│   Menu Mgr │                Preview · Publish · 🌐 · ☾ · ⎋│
│            ├──────────────────────────────────────────────┤
│ ▸ Menu     │ Categories: [All(N)][{cat}(n)] …             │
│   Categ.   │ ┌──────────────────────────────────────────┐ │
│   Tags&Flt │ │ 🔍 search…        Filter ▾  Sort ▾  + Add│ │
│   Settings │ │ … existing item rows                     │ │
│            │ └──────────────────────────────────────────┘ │
└────────────┴──────────────────────────────────────────────┘
```

## Out of scope

- Inline-editable table cells, drag-and-drop reorder, pagination, "Need help?" card, Modifiers tab, Nutrition tab.
- Real publish workflow — Publish button is informational.
- Any DB / auth / pricing changes.
