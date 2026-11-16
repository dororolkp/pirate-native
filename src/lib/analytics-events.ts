export const PUBLIC_EVENTS = [
  "help_opened",
  "mission_history_exported",
  "chart_style_changed",
] as const;
export type PublicEvent = (typeof PUBLIC_EVENTS)[number];
export const ANALYTICS_CONSENT_KEY = "pirate-analytics-consent-v1";
export const PUBLIC_ANALYTICS_PATHS = [
  "/",
  "/robots",
  "/missions",
  "/analytics",
] as const;
