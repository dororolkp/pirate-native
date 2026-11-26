import type { PublicEvent } from "./analytics-events";
import { insightsStore } from "./product-insights";
// Native is intentionally free of Google scripts and browser tracking.
export function trackPublicEvent(event: PublicEvent) {
  return insightsStore.record(event);
}
