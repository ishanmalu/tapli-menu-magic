import posthog from "posthog-js";

const key  = import.meta.env.VITE_POSTHOG_KEY  as string | undefined;
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://eu.i.posthog.com";

export function initPostHog() {
  if (!key) return; // no key = analytics silently disabled (dev / missing env)
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: true,        // auto-tracks every route change
    capture_pageleave: true,
    autocapture: false,            // we fire our own events — keeps data clean
  });
}

// ── Typed event helpers ──────────────────────────────────────────────────────

export function trackMenuViewed(props: { slug: string; restaurantName: string }) {
  posthog.capture("menu_viewed", props);
}

export function trackItemViewed(props: { itemId: string; itemName: string; restaurantId: string }) {
  posthog.capture("item_viewed", props);
}

export function trackFilterUsed(props: { filterType: string; value: string | string[] | number[]; slug: string }) {
  posthog.capture("filter_used", props);
}

export function trackSignupStarted() {
  posthog.capture("signup_started");
}

export function trackSignupCompleted(props: { restaurantName: string }) {
  posthog.capture("signup_completed", props);
}

export function trackSoldOutToggled(props: { itemId: string; itemName: string; soldOut: boolean }) {
  posthog.capture("sold_out_toggled", props);
}

export function identifyUser(userId: string, props?: Record<string, string>) {
  posthog.identify(userId, props);
}

export function resetUser() {
  posthog.reset();
}
