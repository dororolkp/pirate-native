import { describe, expect, it, vi } from "vitest";
import { createInsightsStore } from "../../src/lib/product-insights";

describe("opt-in local aggregate insights", () => {
  it("defaults off and rejects unknown or identifying payloads", () => {
    const store = createInsightsStore();
    expect(store.record("help_opened")).toBe(false);
    store.setEnabled(true);
    expect(store.record("robot_01")).toBe(false);
    expect(store.record("toString")).toBe(false);
    expect(store.getSnapshot().counts.help_opened).toBe(0);
  });
  it("notifies subscribers with immutable, aggregate-only snapshots", () => {
    const store = createInsightsStore();
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    store.setEnabled(true);
    const old = store.getSnapshot();
    expect(store.record("help_opened")).toBe(true);
    expect(store.getSnapshot().counts.help_opened).toBe(1);
    expect(old.counts.help_opened).toBe(0);
    expect(Object.isFrozen(store.getSnapshot().counts)).toBe(true);
    expect(Object.keys(store.getSnapshot())).toEqual(["enabled", "counts"]);
    stop();
    store.record("chart_style_changed");
    expect(listener).toHaveBeenCalledTimes(2);
  });
  it("bounds counters and erases them on disable or fresh store creation", () => {
    const store = createInsightsStore();
    store.setEnabled(true);
    for (let index = 0; index < 1100; index++) store.record("help_opened");
    expect(store.getSnapshot().counts.help_opened).toBe(999);
    expect(store.record("help_opened")).toBe(false);
    store.setEnabled(false);
    expect(store.getSnapshot().counts.help_opened).toBe(0);
    expect(createInsightsStore().getSnapshot().enabled).toBe(false);
  });
  it("clears counters without withdrawing the local preference", () => {
    const store = createInsightsStore();
    store.setEnabled(true);
    store.record("mission_history_exported");
    store.clear();
    expect(store.getSnapshot()).toMatchObject({
      enabled: true,
      counts: { mission_history_exported: 0 },
    });
  });
  it("retains only the current snapshot and removes RxJS subscriptions", () => {
    const store = createInsightsStore();
    store.setEnabled(true);
    store.record("help_opened");
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot().counts.help_opened).toBe(1);
    store.record("help_opened");
    expect(listener).toHaveBeenCalledOnce();
    stop();
    stop();
    store.clear();
    expect(listener).toHaveBeenCalledOnce();
  });
});
