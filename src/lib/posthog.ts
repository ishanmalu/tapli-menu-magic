import posthog from "posthog-js";

const key  = import.meta.env.VITE_POSTHOG_KEY  as string | undefined;
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://eu.i.posthog.com";

export function initPostHog() {
  if (!key) return;
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
  });
}

// ── Customer menu ────────────────────────────────────────────────────────────

export function trackMenuViewed(props: { slug: string; restaurantName: string }) {
  posthog.capture("menu_viewed", props);
}

export function trackItemViewed(props: { itemId: string; itemName: string; restaurantId: string }) {
  posthog.capture("item_viewed", props);
}

// Called when a specific allergen badge is toggled on/off
export function trackAllergenToggled(props: { allergen: string; active: boolean; slug: string }) {
  posthog.capture("allergen_filter_toggled", props);
}

// Called when a specific dietary badge is toggled on/off
export function trackDietaryToggled(props: { tag: string; active: boolean; slug: string }) {
  posthog.capture("dietary_filter_toggled", props);
}

// Called when a food style chip is toggled (High Protein, Keto, etc.)
export function trackFoodStyleToggled(props: { style: string; active: boolean; slug: string }) {
  posthog.capture("food_style_toggled", props);
}

// Called when a slider is released (calorie / protein / budget)
export function trackSliderChanged(props: { slider: "calories" | "protein" | "budget"; min: number; max: number; slug: string }) {
  posthog.capture("slider_changed", props);
}

// Called when the filter panel is opened or closed
export function trackFilterPanelToggled(props: { open: boolean; slug: string }) {
  posthog.capture("filter_panel_toggled", props);
}

// Called when all filters are cleared
export function trackFilterCleared(props: { slug: string }) {
  posthog.capture("filters_cleared", props);
}

// Called when language is switched
export function trackLanguageSwitched(props: { language: "en" | "fi" }) {
  posthog.capture("language_switched", props);
}

// Called when theme is toggled
export function trackThemeToggled(props: { theme: "light" | "dark" }) {
  posthog.capture("theme_toggled", props);
}

// ── Homepage ─────────────────────────────────────────────────────────────────

export function trackSignupStarted(props: { button: string }) {
  posthog.capture("signup_started", props);
}

export function trackDemoClicked() {
  posthog.capture("demo_clicked");
}

export function trackNavClicked(props: { page: string }) {
  posthog.capture("nav_clicked", props);
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export function trackSignupCompleted(props: { restaurantName: string }) {
  posthog.capture("signup_completed", props);
}

export function trackItemAdded(props: { itemName: string; categoryId: string | null }) {
  posthog.capture("item_added", props);
}

export function trackItemEdited(props: { itemId: string; itemName: string }) {
  posthog.capture("item_edited", props);
}

export function trackItemDeleted(props: { itemId: string; itemName: string }) {
  posthog.capture("item_deleted", props);
}

export function trackSoldOutToggled(props: { itemId: string; itemName: string; soldOut: boolean }) {
  posthog.capture("sold_out_toggled", props);
}

export function trackPhotoUploaded(props: { type: "logo" | "cover" | "item" }) {
  posthog.capture("photo_uploaded", props);
}

export function trackQrViewed(props: { slug: string }) {
  posthog.capture("qr_viewed", props);
}

export function trackDashboardCategoryTabClicked(props: { categoryName: string }) {
  posthog.capture("dashboard_category_tab_clicked", props);
}

export function trackDashboardSearchUsed(props: { query: string }) {
  posthog.capture("dashboard_search_used", props);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export function identifyUser(userId: string, props?: Record<string, string>) {
  posthog.identify(userId, props);
}

export function resetUser() {
  posthog.reset();
}
