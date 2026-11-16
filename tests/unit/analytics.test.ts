// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_CONSENT_KEY } from "../../src/lib/analytics-events";
import { trackPublicEvent as nativeEvent } from "../../src/lib/analytics";

const flags = window as unknown as Record<string, unknown>;
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("EXPO_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
  localStorage.clear();
  window.history.replaceState(null, "", "/missions");
  flags.gtag = vi.fn();
});
afterEach(() => {
  vi.unstubAllEnvs();
  delete flags.gtag;
  delete flags["ga-disable-G-TEST123"];
});
describe("Allowlisted optional analytics", () => {
  it("never sends native analytics", () =>
    expect(nativeEvent("help_opened")).toBe(false));
  it("does not send without affirmative consent", async () => {
    const analytics = await import("../../src/lib/analytics.web");
    expect(analytics.trackPublicEvent("help_opened")).toBe(false);
    expect(flags.gtag).not.toHaveBeenCalled();
  });
  it("sends a fixed event without arbitrary user or robot payloads", async () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, "granted");
    const analytics = await import("../../src/lib/analytics.web");
    expect(analytics.trackPublicEvent("mission_history_exported")).toBe(true);
    expect(flags.gtag).toHaveBeenCalledWith(
      "event",
      "mission_history_exported",
      {
        event_category: "public_workspace_ui",
        page_location: "https://pirate-native.vercel.app/missions",
        page_referrer: "",
      },
    );
    expect(analytics.trackPublicEvent("raw-command" as "help_opened")).toBe(
      false,
    );
  });
  it.each(["/settings", "/logbook", "/unknown"])(
    "excludes private or unknown page %s",
    async (path) => {
      localStorage.setItem(ANALYTICS_CONSENT_KEY, "granted");
      window.history.replaceState(null, "", path);
      const analytics = await import("../../src/lib/analytics.web");
      expect(analytics.trackPublicEvent("help_opened")).toBe(false);
      expect(flags.gtag).not.toHaveBeenCalled();
    },
  );
  it("honors revocation and the Google disable flag", async () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, "granted");
    const analytics = await import("../../src/lib/analytics.web");
    flags["ga-disable-G-TEST123"] = true;
    expect(analytics.trackPublicEvent("help_opened")).toBe(false);
    flags["ga-disable-G-TEST123"] = false;
    localStorage.setItem(ANALYTICS_CONSENT_KEY, "denied");
    expect(analytics.trackPublicEvent("help_opened")).toBe(false);
  });
  it("keeps analytics off without a real configured measurement ID", async () => {
    vi.stubEnv("EXPO_PUBLIC_GA_MEASUREMENT_ID", "");
    localStorage.setItem(ANALYTICS_CONSENT_KEY, "granted");
    const analytics = await import("../../src/lib/analytics.web");
    expect(analytics.trackPublicEvent("help_opened")).toBe(false);
  });
  it("removes consent listeners and clears only Google cookies", async () => {
    const analytics = await import("../../src/lib/analytics.web");
    const listener = vi.fn();
    const stop = analytics.subscribeConsent(listener);
    window.dispatchEvent(new Event("pirate-consent"));
    expect(listener).toHaveBeenCalledOnce();
    stop();
    window.dispatchEvent(new Event("pirate-consent"));
    expect(listener).toHaveBeenCalledOnce();
    document.cookie = "_ga=test; path=/";
    document.cookie = "workspace_theme=light; path=/";
    analytics.clearAnalyticsCookies();
    expect(document.cookie).not.toContain("_ga=");
    expect(document.cookie).toContain("workspace_theme=light");
  });
});
