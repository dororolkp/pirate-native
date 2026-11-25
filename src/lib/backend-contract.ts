import { z } from "zod";
import type { Mission, Robot, StationId } from "./fleet-domain";

// David's config.py defaults. Keep overrides synchronized with BACKEND_STATIONS.
export const WORLD_STATIONS = {
  station_a: { x: -4, y: 0, theta: 0 },
  station_b: { x: -14, y: 6, theta: 0 },
} as const;
export const WORLD_BOUNDS = { minX: -18, maxX: 0, minY: -4, maxY: 10 };

export function worldToMap(pose: { x: number; y: number; theta: number }) {
  return {
    x: 220 + (pose.x - WORLD_BOUNDS.minX) * 20,
    y: 335 - (pose.y - WORLD_BOUNDS.minY) * 20,
    yaw: -pose.theta,
  };
}

const timestamp = z.iso.datetime({ offset: true });
export const backendRobotSchema = z.object({
  robot_id: z.string().min(1),
  connected: z.boolean(),
  state: z.enum(["idle", "busy", "offline"]),
  pose: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    theta: z.number().finite(),
  }),
  current_task_id: z.string().min(1).nullable(),
  updated_at: timestamp,
});
export const backendTaskSchema = z.object({
  task_id: z.string().min(1),
  robot_id: z.string().min(1),
  destination: z.enum(["station_a", "station_b"]),
  state: z.enum(["queued", "running", "completed", "failed", "canceled"]),
  progress: z.number().min(0).max(1),
  created_at: timestamp,
  updated_at: timestamp,
  started_at: timestamp.nullable(),
  finished_at: timestamp.nullable(),
  error: z.string().nullable(),
});
export type BackendRobot = z.infer<typeof backendRobotSchema>;
export type BackendTask = z.infer<typeof backendTaskSchema>;

export function adaptRobot(raw: BackendRobot, receivedAt = Date.now()): Robot {
  return {
    robot_id: raw.robot_id,
    name: raw.robot_id,
    connected: raw.connected,
    status: raw.connected ? raw.state : "offline",
    pose: worldToMap(raw.pose),
    worldPose: raw.pose,
    battery: null,
    heartbeat_at: raw.updated_at,
    // updated_at is a state/pose update, not an idle heartbeat in the mock adapter.
    api_received_at: new Date(receivedAt).toISOString(),
  };
}

export function adaptTask(
  raw: BackendTask,
  origin?: Mission["origin"],
): Mission {
  const opposite: StationId =
    raw.destination === "station_a" ? "station_b" : "station_a";
  return {
    task_id: raw.task_id,
    robot_id: raw.robot_id,
    destination: raw.destination,
    origin: origin ?? worldToMap(WORLD_STATIONS[opposite]),
    status: raw.state,
    progress: Math.round(raw.progress * 100),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    started_at: raw.started_at ?? undefined,
    finished_at: raw.finished_at ?? undefined,
    error: raw.error ?? undefined,
  };
}

export function normalizeBackendUrl(value: string) {
  const url = new URL(value.trim());
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "Use an HTTP(S) server URL without credentials, query strings or fragments.",
    );
  if (/\/api(?:\/v1)?\/?$/.test(url.pathname))
    throw new Error("Enter the server base URL only, without /api or /api/v1.");
  return url.toString().replace(/\/+$/, "");
}
