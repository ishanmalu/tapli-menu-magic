## Plan: UI-only Pricing & Upgrade pages

### 1. New file: `src/pages/Pricing.tsx`
- Top nav matching `Index.tsx` (theme-aware logo, LanguageToggle, ThemeToggle, Sign In)
- Centered header: title + "All plans include a 14-day free trial. No credit card required."
- 3 plan cards in `grid md:grid-cols-3 gap-6` using existing `Card`/`Button`/`Badge`:
  - Monthly — €35/month, billed monthly
  - Quarterly — €29/month, billed €87 / 3 months, Badge "Save 17%"
  - Annual — €25/month, billed €300/year, Badge "Most Popular · Save 29%", highlighted via `border-2 border-foreground` + `shadow-lg`
- Each card: name, large price, billing frequency (muted), savings badge, 6-item feature list with lucide `Check` icons, full-width "Start Free Trial" `<Link to="/auth">` button.

### 2. New file: `src/pages/Upgrade.tsx`
- Same nav + same 3 plan cards
- Button label: "Subscribe Now"
- `useState` `loadingPlan` — clicked button shows `Loader2` spinner + disabled. No real network call (Stripe placeholder).

### 3. `src/App.tsx`
- Add `<Route path="/pricing" element={<Pricing />} />` and `<Route path="/upgrade" element={<Upgrade />} />`.

### 4. `src/contexts/LanguageContext.tsx`
Add EN + FI keys: `pricingTitle`, `pricingSubtitle`, `freeTrialNote`, `planMonthly`, `planQuarterly`, `planAnnual`, `billedMonthly`, `billedQuarterly`, `billedAnnually`, `perMonth`, `save17`, `save29`, `mostPopular`, `startFreeTrial`, `subscribeNow`, `upgradeTitle`, `upgradeSubtitle`, `featUnlimitedMenus`, `featRealtimeUpdates`, `featQrNfc`, `featAllergenInfo`, `featPhotoUploads`, `featBilingual`. Prices stay as literals (€).

### 5. `src/pages/Index.tsx`
- Add a "Pricing" link (`<Link to="/pricing">`) in the top nav before Sign In. No other changes.

### Constraints honored
- Existing shadcn/ui + Tailwind tokens only (`bg-background`, `bg-card`, `text-muted-foreground`, `border-foreground`). No new colors/styles.
- All copy via `t()` — no hardcoded English. Prices in € only.
- No DB changes, no migrations, no Stripe enablement.
- No edits to Auth, Dashboard, CustomerMenu, or other components.