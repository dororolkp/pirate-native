import type { PublicEvent } from "./analytics-events";
// Native is intentionally free of Google scripts and browser tracking.
export function trackPublicEvent(_event: PublicEvent) {
  return false;
}
