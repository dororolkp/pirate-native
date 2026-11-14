import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import {
  activeMission,
  dispatchError,
  FleetSnapshot,
  StationId,
} from "./fleet-domain";
import {
  addEvent,
  cancelMission,
  createDemo,
  createMission,
  moveManual,
  setConnection,
  setManual,
  setScenario,
  stopSimulation,
  tickDemo,
} from "./demo-simulator";

const robotSchema = z.object({
  robot_id: z.string().min(1),
  name: z.string().default("Atlas"),
  connected: z.boolean(),
  status: z.enum(["idle", "busy", "manual", "offline"]),
  pose: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    yaw: z.number().finite(),
  }),
  battery: z.number().min(0).max(100),
  heartbeat_at: z.iso.datetime(),
});
const taskSchema = z.object({
  task_id: z.string().min(1),
  robot_id: z.string().min(1),
  destination: z.enum(["station_a", "station_b"]),
  origin: z
    .object({ x: z.number().finite(), y: z.number().finite() })
    .default({ x: 140, y: 220 }),
  status: z.enum(["queued", "running", "completed", "failed", "canceled"]),
  progress: z.number().min(0).max(100),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  started_at: z.iso.datetime().optional(),
  finished_at: z.iso.datetime().optional(),
  error: z.string().optional(),
});
const snapshotSchema = z.object({
  robot: robotSchema,
  missions: z.array(taskSchema).max(200),
  events: z
    .array(
      z.object({
        event_id: z.string(),
        robot_id: z.string(),
        task_id: z.string().optional(),
        timestamp: z.iso.datetime(),
        level: z.enum(["info", "success", "warning", "error"]),
        message: z.string(),
      }),
    )
    .max(60),
  manual: z.boolean(),
  scenario: z.enum(["normal", "obstacle", "timeout"]),
});
export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
export const ROBOT_ID = process.env.EXPO_PUBLIC_ROBOT_ID || "robot_01";
export type DemoCommand =
  | "disconnect"
  | "reconnect"
  | "manual-on"
  | "manual-off"
  | "left"
  | "right"
  | "up"
  | "down"
  | "normal"
  | "obstacle"
  | "timeout"
  | "stop"
  | "reset";
type Listener = (snapshot: FleetSnapshot, error?: string) => void;
export interface FleetService {
  subscribe(listener: Listener): () => void;
  dispatch(destination: StationId): Promise<void>;
  cancel(taskId: string): Promise<void>;
  demo(command: DemoCommand): Promise<void>;
  refresh(): Promise<void>;
}
const clone = (snapshot: FleetSnapshot): FleetSnapshot =>
  JSON.parse(JSON.stringify(snapshot));
export const STORAGE_KEY = "pirate-native-demo-v1";
export class DemoFleetService implements FleetService {
  private snapshot = createDemo();
  private listener?: Listener;
  private writes: Promise<void> = Promise.resolve();
  private storageIssue?: string;
  private ready: Promise<void>;
  constructor() {
    this.ready = this.load();
  }
  private async load() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) this.snapshot = snapshotSchema.parse(JSON.parse(saved));
    } catch {
      this.storageIssue =
        "Saved demo data could not be read. A fresh demo was loaded.";
    }
    this.snapshot.manual = false;
    if (this.snapshot.robot.status === "manual")
      this.snapshot.robot.status = "idle";
    tickDemo(this.snapshot);
  }
  private publish() {
    const data = clone(this.snapshot);
    this.listener?.(data, this.storageIssue);
    // Serialize writes so an older asynchronous save cannot overwrite a newer command.
    this.writes = this.writes.then(async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        this.storageIssue =
          "Device storage is unavailable. Demo changes may not survive a restart.";
        this.listener?.(clone(this.snapshot), this.storageIssue);
      }
    });
    return this.writes;
  }
  subscribe(listener: Listener) {
    this.listener = listener;
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    void this.ready.then(() => {
      if (stopped) return;
      void this.publish();
      timer = setInterval(() => {
        tickDemo(this.snapshot);
        void this.publish();
      }, 500);
    });
    return () => {
      stopped = true;
      clearInterval(timer);
      this.listener = undefined;
    };
  }
  async dispatch(destination: StationId) {
    await this.ready;
    tickDemo(this.snapshot);
    createMission(this.snapshot, destination);
    await this.publish();
  }
  async cancel(taskId: string) {
    await this.ready;
    cancelMission(this.snapshot, taskId);
    await this.publish();
  }
  async refresh() {
    await this.ready;
    tickDemo(this.snapshot);
    await this.publish();
  }
  async demo(command: DemoCommand) {
    await this.ready;
    if (command === "reset") {
      this.snapshot = createDemo();
      this.storageIssue = undefined;
    } else if (command === "stop") stopSimulation(this.snapshot);
    else if (command === "disconnect" || command === "reconnect")
      setConnection(this.snapshot, command === "reconnect");
    else if (command === "manual-on" || command === "manual-off")
      setManual(this.snapshot, command === "manual-on");
    else if (
      command === "normal" ||
      command === "obstacle" ||
      command === "timeout"
    )
      setScenario(this.snapshot, command);
    else {
      const [dx, dy] = {
        left: [-1, 0],
        right: [1, 0],
        up: [0, -1],
        down: [0, 1],
      }[command];
      moveManual(this.snapshot, dx, dy);
    }
    await this.publish();
  }
}
export function emptyLiveSnapshot(): FleetSnapshot {
  return {
    robot: {
      robot_id: ROBOT_ID,
      name: "Atlas",
      connected: false,
      status: "offline",
      pose: { x: 140, y: 220, yaw: 0 },
      battery: 0,
      heartbeat_at: "1970-01-01T00:00:00.000Z",
    },
    missions: [],
    events: [],
    manual: false,
    scenario: "normal",
  };
}
export class ApiFleetService implements FleetService {
  private snapshot?: FleetSnapshot;
  private listener?: Listener;
  private stopped = false;
  private refreshing?: Promise<void>;
  private connectionIssue?: string;
  private ambiguous = false;
  private mutating = false;
  private controllers = new Set<AbortController>();
  constructor(private baseUrl: string) {}
  private async request(path: string, options: RequestInit = {}) {
    const controller = new AbortController();
    this.controllers.add(controller);
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${this.baseUrl}/api/v1${path}`, {
        ...options,
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          typeof body?.detail === "string"
            ? body.detail
            : `API request failed (${response.status}).`,
        );
      return body;
    } finally {
      clearTimeout(timeout);
      this.controllers.delete(controller);
    }
  }
  private publish() {
    if (!this.stopped)
      this.listener?.(
        clone(this.snapshot ?? emptyLiveSnapshot()),
        this.ambiguous
          ? "Command outcome is unknown. Dispatch is locked for this session. Ask the backend operator to reconcile before restarting."
          : this.connectionIssue,
      );
  }
  subscribe(listener: Listener) {
    this.stopped = false;
    this.listener = listener;
    void this.refresh();
    // Polling is supported on native and web without relying on browser EventSource.
    const timer = setInterval(() => void this.refresh(), 2000);
    return () => {
      this.stopped = true;
      clearInterval(timer);
      this.controllers.forEach((c) => c.abort());
      this.listener = undefined;
    };
  }
  refresh(): Promise<void> {
    if (this.stopped) return Promise.resolve();
    if (this.refreshing) return this.refreshing;
    this.refreshing = this.fetchSnapshot().finally(() => {
      this.refreshing = undefined;
    });
    return this.refreshing;
  }
  private async fetchSnapshot() {
    try {
      const raw = await this.request("/robots");
      const robots = z
        .array(robotSchema)
        .parse(Array.isArray(raw) ? raw : raw?.robots);
      const robot = robots.find((r) => r.robot_id === ROBOT_ID);
      if (!robot)
        throw new Error("Configured robot is missing from the API response.");
      const task = this.snapshot && activeMission(this.snapshot);
      const updated = task
        ? taskSchema.parse(
            await this.request(`/tasks/${encodeURIComponent(task.task_id)}`),
          )
        : undefined;
      if (
        updated &&
        (updated.task_id !== task?.task_id || updated.robot_id !== ROBOT_ID)
      )
        throw new Error(
          "API returned a task for a different robot or task ID.",
        );
      if (this.stopped) return;
      // Read the latest local list after fetching to preserve concurrently accepted task IDs.
      const snapshot: FleetSnapshot = {
        robot,
        missions: this.snapshot?.missions ?? [],
        events: this.snapshot?.events ?? [],
        manual: robot.status === "manual",
        scenario: "normal",
      };
      if (updated) {
        snapshot.missions = snapshot.missions.map((m) =>
          m.task_id === updated.task_id ? updated : m,
        );
        if (updated.status !== task?.status)
          addEvent(
            snapshot,
            `Mission ${updated.task_id}: ${updated.status}${updated.error ? ` - ${updated.error}` : ""}.`,
            updated.status === "failed"
              ? "error"
              : updated.status === "completed"
                ? "success"
                : "info",
            Date.parse(updated.updated_at),
            updated.task_id,
          );
      }
      if (!this.snapshot)
        addEvent(
          snapshot,
          "Backend connected. Live history is local to this session.",
          "info",
          Date.now(),
        );
      this.snapshot = snapshot;
      this.connectionIssue = undefined;
    } catch (error) {
      this.connectionIssue =
        error instanceof z.ZodError
          ? "API response does not match the documented contract."
          : error instanceof Error
            ? error.message
            : "Could not refresh telemetry.";
    }
    this.publish();
  }
  async dispatch(destination: StationId) {
    if (this.mutating) throw new Error("Another command is pending.");
    if (this.ambiguous)
      throw new Error(
        "Command outcome is unknown. Reconcile with the backend operator before restarting.",
      );
    if (this.connectionIssue)
      throw new Error(
        "Connection unavailable. Refresh telemetry before dispatching.",
      );
    if (!this.snapshot) throw new Error("Wait for a backend connection.");
    const error = dispatchError(this.snapshot, destination);
    if (error) throw new Error(error);
    this.mutating = true;
    try {
      let result: { task_id: string; state: "queued" };
      try {
        result = z
          .object({ task_id: z.string().min(1), state: z.literal("queued") })
          .parse(
            await this.request("/tasks", {
              method: "POST",
              body: JSON.stringify({
                robot_id: this.snapshot.robot.robot_id,
                destination,
              }),
            }),
          );
      } catch (error) {
        // Even a malformed reply or server error can follow an accepted side effect.
        this.ambiguous = true;
        this.publish();
        throw error;
      }
      const timestamp = new Date().toISOString();
      this.snapshot.missions.unshift({
        task_id: result.task_id,
        robot_id: this.snapshot.robot.robot_id,
        destination,
        origin: {
          x: this.snapshot.robot.pose.x,
          y: this.snapshot.robot.pose.y,
        },
        status: "queued",
        progress: 0,
        created_at: timestamp,
        updated_at: timestamp,
      });
      this.snapshot.missions = this.snapshot.missions.slice(0, 200);
      addEvent(
        this.snapshot,
        `Mission ${result.task_id} accepted by backend.`,
        "info",
        Date.now(),
        result.task_id,
      );
      this.publish();
      await this.refresh();
    } finally {
      this.mutating = false;
    }
  }
  async cancel(taskId: string) {
    if (this.mutating) throw new Error("Another command is pending.");
    if (!this.snapshot || activeMission(this.snapshot)?.task_id !== taskId)
      throw new Error("This mission is no longer active.");
    this.mutating = true;
    try {
      await this.request(`/tasks/${encodeURIComponent(taskId)}/cancel`, {
        method: "POST",
      });
      await this.refresh();
      // HTTP acceptance never changes local status to canceled; robot acknowledgment must do so.
    } finally {
      this.mutating = false;
    }
  }
  async demo() {
    throw new Error("Simulation controls are unavailable in live API mode.");
  }
}
