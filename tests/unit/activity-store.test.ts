import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACTIVITY_KEY,
  ACTIVITY_LIMIT,
  ACTIVITY_RETENTION_MS,
  ActivityCode,
  ActivityStore,
  activityCsv,
} from "../../src/lib/activity-store";

function storage(saved: string | null = null) {
  return {
    getItem: vi.fn().mockResolvedValue(saved),
    setItem: vi.fn().mockResolvedValue(undefined),
  };
}
afterEach(() => vi.useRealTimers());
describe("Privacy-aware local logbook", () => {
  it("records fixed codes without task IDs, raw payloads or free-text messages", async () => {
    const persistence = storage();
    const journal = new ActivityStore(persistence);
    await journal.record("mission_dispatch", "ok", "demo");
    expect(persistence.getItem).toHaveBeenCalledWith(ACTIVITY_KEY);
    expect(journal.getSnapshot().entries[0]).toMatchObject({
      code: "mission_dispatch",
      outcome: "ok",
      mode: "demo",
    });
    const payload = JSON.parse(persistence.setItem.mock.calls[0][1]);
    expect(Object.keys(payload.entries[0]).sort()).toEqual([
      "code",
      "id",
      "mode",
      "outcome",
      "timestamp",
    ]);
    await journal.record("raw secret" as ActivityCode, "ok", "demo");
    expect(journal.getSnapshot().entries).toHaveLength(1);
  });
  it("loads once and waits for hydration before recording", async () => {
    const persistence = storage();
    let release!: (value: string | null) => void;
    persistence.getItem.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const journal = new ActivityStore(persistence);
    const first = journal.record("workspace_opened", "info", "demo");
    const second = journal.record("mission_dispatch", "ok", "demo");
    expect(persistence.getItem).toHaveBeenCalledOnce();
    release(null);
    await Promise.all([first, second]);
    expect(journal.getSnapshot().entries).toHaveLength(2);
  });
  it("caps records and purges expired history", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-17T12:00:00Z"));
    const journal = new ActivityStore(storage());
    for (let i = 0; i < ACTIVITY_LIMIT + 5; i++)
      await journal.record("demo_control", "ok", "demo");
    expect(journal.getSnapshot().entries).toHaveLength(ACTIVITY_LIMIT);
    vi.setSystemTime(Date.now() + ACTIVITY_RETENTION_MS + 1);
    await journal.record("workspace_opened", "info", "demo");
    expect(journal.getSnapshot().entries).toHaveLength(1);
  });
  it("clears and persists opt-out without retaining further actions", async () => {
    const persistence = storage();
    const journal = new ActivityStore(persistence);
    await journal.record("mission_dispatch", "ok", "demo");
    await journal.setEnabled(false);
    await journal.record("demo_control", "ok", "demo");
    expect(journal.getSnapshot()).toMatchObject({
      enabled: false,
      entries: [],
    });
    const restored = new ActivityStore(
      storage(persistence.setItem.mock.calls.at(-1)![1]),
    );
    await restored.initialize();
    expect(restored.getSnapshot()).toMatchObject({
      enabled: false,
      entries: [],
    });
    await restored.setEnabled(true);
    await restored.record("workspace_opened", "info", "demo");
    expect(restored.getSnapshot().entries).toHaveLength(1);
  });
  it("clears local entries without disabling future recording", async () => {
    const journal = new ActivityStore(storage());
    await journal.record("workspace_opened", "info", "demo");
    await journal.clear();
    expect(journal.getSnapshot()).toMatchObject({ entries: [], enabled: true });
  });
  it("recovers from invalid saved records and exposes storage failures", async () => {
    const persistence = storage("{invalid");
    const journal = new ActivityStore(persistence);
    await journal.initialize();
    expect(journal.getSnapshot().error).toContain("could not be read");
    persistence.setItem.mockRejectedValueOnce(new Error("quota"));
    await expect(
      journal.record("workspace_opened", "info", "demo"),
    ).resolves.toBeUndefined();
    expect(journal.getSnapshot().error).toContain("storage unavailable");
  });
  it("notifies subscribers and removes them on cleanup", async () => {
    const journal = new ActivityStore(storage());
    const listener = vi.fn();
    const unsubscribe = journal.subscribe(listener);
    await journal.initialize();
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    await journal.record("workspace_opened", "info", "demo");
    expect(listener).toHaveBeenCalledOnce();
  });
  it("exports fixed human-readable labels, not internal IDs", async () => {
    const journal = new ActivityStore(storage());
    await journal.record("mission_cancel", "ok", "live");
    const csv = activityCsv(journal.getSnapshot().entries);
    expect(csv).toContain('"Mission cancellation request","live","ok"');
    expect(csv).not.toContain(journal.getSnapshot().entries[0].id);
  });
});
