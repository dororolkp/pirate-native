import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { z } from "zod";

export const ACTIVITY_KEY = "pirate-local-activity-v1";
export const ACTIVITY_LIMIT = 200;
export const ACTIVITY_RETENTION_MS = 7 * 86_400_000;
export const ACTIVITY_CODES = [
  "workspace_opened",
  "mission_dispatch",
  "mission_cancel",
  "demo_control",
  "telemetry_refresh",
  "telemetry_unavailable",
  "telemetry_recovered",
  "mission_running",
  "mission_completed",
  "mission_failed",
  "mission_canceled",
  "history_export",
] as const;
export type ActivityCode = (typeof ACTIVITY_CODES)[number];
export const ACTIVITY_LABELS: Record<ActivityCode, string> = {
  workspace_opened: "Workspace opened",
  mission_dispatch: "Mission dispatch request",
  mission_cancel: "Mission cancellation request",
  demo_control: "Local simulation control",
  telemetry_refresh: "Telemetry refresh request",
  telemetry_unavailable: "Telemetry unavailable",
  telemetry_recovered: "Telemetry recovered",
  mission_running: "Mission started",
  mission_completed: "Mission completed",
  mission_failed: "Mission failed",
  mission_canceled: "Mission canceled",
  history_export: "Mission history exported",
};
const entrySchema = z.object({
  id: z.string().min(1).max(100),
  timestamp: z.iso.datetime(),
  code: z.enum(ACTIVITY_CODES),
  mode: z.enum(["demo", "live"]),
  outcome: z.enum(["ok", "failed", "info"]),
});
const savedSchema = z.object({
  version: z.literal(1),
  enabled: z.boolean(),
  entries: z.array(entrySchema).max(ACTIVITY_LIMIT),
});
export type ActivityEntry = z.infer<typeof entrySchema>;
export interface ActivitySnapshot {
  entries: ActivityEntry[];
  enabled: boolean;
  ready: boolean;
  error: string | null;
}
export const EMPTY_ACTIVITY: ActivitySnapshot = {
  entries: [],
  enabled: true,
  ready: false,
  error: null,
};
type Storage = Pick<typeof AsyncStorage, "getItem" | "setItem">;

/** Local diagnostic journal, not a backend audit log. No free-text/robot payloads are accepted. */
export class ActivityStore {
  private snapshot: ActivitySnapshot = { ...EMPTY_ACTIVITY, entries: [] };
  private listeners = new Set<() => void>();
  private ready?: Promise<void>;
  private writes = Promise.resolve();
  constructor(private storage: Storage = AsyncStorage) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit() {
    this.listeners.forEach((listener) => listener());
  }
  private retained(entries: ActivityEntry[], now = Date.now()) {
    return entries
      .filter((entry) => {
        const age = now - Date.parse(entry.timestamp);
        return age >= -60_000 && age <= ACTIVITY_RETENTION_MS;
      })
      .slice(0, ACTIVITY_LIMIT);
  }
  initialize() {
    this.ready ??= this.load();
    return this.ready;
  }
  private async load() {
    try {
      const raw = await this.storage.getItem(ACTIVITY_KEY);
      if (raw) {
        const saved = savedSchema.parse(JSON.parse(raw));
        this.snapshot = {
          ...this.snapshot,
          enabled: saved.enabled,
          entries: saved.enabled ? this.retained(saved.entries) : [],
        };
      }
    } catch {
      this.snapshot = {
        ...this.snapshot,
        error: "Saved logbook could not be read. Local history started fresh.",
      };
    }
    this.snapshot = { ...this.snapshot, ready: true };
    this.emit();
  }
  private save() {
    const payload = JSON.stringify({
      version: 1,
      enabled: this.snapshot.enabled,
      entries: this.retained(this.snapshot.entries),
    });
    this.writes = this.writes.then(async () => {
      try {
        await this.storage.setItem(ACTIVITY_KEY, payload);
      } catch {
        this.snapshot = {
          ...this.snapshot,
          error:
            "Logbook storage unavailable. Records may not survive a restart.",
        };
        this.emit();
      }
    });
    return this.writes;
  }
  async record(
    code: ActivityCode,
    outcome: ActivityEntry["outcome"],
    mode: ActivityEntry["mode"],
  ) {
    await this.initialize();
    if (!this.snapshot.enabled) return;
    const entry = entrySchema.safeParse({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      code,
      outcome,
      mode,
    });
    if (!entry.success) return;
    this.snapshot = {
      ...this.snapshot,
      entries: this.retained([entry.data, ...this.snapshot.entries]),
    };
    this.emit();
    await this.save();
  }
  async clear() {
    await this.initialize();
    this.snapshot = { ...this.snapshot, entries: [], error: null };
    this.emit();
    await this.save();
  }
  async setEnabled(enabled: boolean) {
    await this.initialize();
    this.snapshot = {
      ...this.snapshot,
      enabled,
      entries: enabled ? this.snapshot.entries : [],
      error: null,
    };
    this.emit();
    await this.save();
  }
}
export const activityStore = new ActivityStore();
export function activityCsv(entries: ActivityEntry[]) {
  const rows = entries.map((entry) => [
    entry.timestamp,
    ACTIVITY_LABELS[entry.code],
    entry.mode,
    entry.outcome,
  ]);
  return [["timestamp", "event", "mode", "outcome"], ...rows]
    .map((row) =>
      row.map((value) => `"${value.replace(/"/g, '""')}"`).join(","),
    )
    .join("\r\n");
}
