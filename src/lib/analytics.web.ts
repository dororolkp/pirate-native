import {
  ANALYTICS_CONSENT_KEY,
  PUBLIC_ANALYTICS_PATHS,
  PUBLIC_EVENTS,
  PublicEvent,
} from "./analytics-events";
import { insightsStore } from "./product-insights";

export const measurement = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID ?? "";
export const validMeasurement = /^G-[A-Z0-9]+$/.test(measurement);
export type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};
export function analyticsAllowed() {
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}
export function subscribeConsent(update: () => void) {
  window.addEventListener("pirate-consent", update);
  window.addEventListener("storage", update);
  return () => {
    window.removeEventListener("pirate-consent", update);
    window.removeEventListener("storage", update);
  };
}
export function trackPublicEvent(event: PublicEvent) {
  const recordedLocally = insightsStore.record(event);
  if (
    !validMeasurement ||
    !analyticsAllowed() ||
    !PUBLIC_EVENTS.includes(event) ||
    !PUBLIC_ANALYTICS_PATHS.some((path) => path === window.location.pathname)
  )
    return recordedLocally;
  const analytics = window as AnalyticsWindow;
  if (
    (window as unknown as Record<string, unknown>)[
      `ga-disable-${measurement}`
    ] ||
    !analytics.gtag
  )
    return recordedLocally;
  analytics.gtag("event", event, {
    event_category: "public_workspace_ui",
    page_location: `https://pirate-native.vercel.app${window.location.pathname}`,
    page_referrer: "",
  });
  return true;
}
export function clearAnalyticsCookies() {
  // Best effort for cookies on this host. Already-sent Google data cannot be recalled.
  for (const part of document.cookie.split(";")) {
    const name = part.trim().split("=")[0];
    if (name === "_ga" || name.startsWith("_ga_")) {
      for (const domain of ["", `; domain=${window.location.hostname}`])
        document.cookie = `${name}=; Max-Age=0; path=/${domain}; SameSite=Lax`;
    }
  }
}
