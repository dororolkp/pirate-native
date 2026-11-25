/** Demo/map coordinates are pixels; live robots also retain their authoritative world pose. */
export type StationId = "station_a" | "station_b";
export type Scenario = "normal" | "obstacle" | "timeout";
export type TaskStatus =
  "queued" | "running" | "completed" | "failed" | "canceled";
export const STATIONS = {
  station_a: {
    label: "Station A",
    description: "Receiving dock",
    x: 140,
    y: 220,
  },
  station_b: {
    label: "Station B",
    description: "Dispatch dock",
    x: 660,
    y: 220,
  },
} as const;
export interface Robot {
  robot_id: string;
  name: string;
  connected: boolean;
  status: "idle" | "busy" | "manual" | "offline";
  pose: { x: number; y: number; yaw: number };
  worldPose?: { x: number; y: number; theta: number };
  battery: number | null;
  heartbeat_at: string;
  api_received_at?: string;
}
export interface Mission {
  task_id: string;
  robot_id: string;
  destination: StationId;
  origin: { x: number; y: number };
  status: TaskStatus;
  progress: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  finished_at?: string;
  error?: string;
}
export interface FleetEvent {
  event_id: string;
  robot_id: string;
  task_id?: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}
export interface FleetSnapshot {
  robot: Robot;
  missions: Mission[];
  events: FleetEvent[];
  manual: boolean;
  scenario: Scenario;
}
export const activeMission = (snapshot: FleetSnapshot) =>
  snapshot.missions.find(
    (m) => m.status === "queued" || m.status === "running",
  );
export function isStale(robot: Robot, now = Date.now()) {
  const heartbeat = Date.parse(robot.api_received_at ?? robot.heartbeat_at);
  return (
    !Number.isFinite(heartbeat) ||
    now - heartbeat > 10_000 ||
    heartbeat - now > 10_000
  );
}
export function dispatchError(
  snapshot: FleetSnapshot,
  destination: string,
  now = Date.now(),
) {
  if (!Object.hasOwn(STATIONS, destination))
    return "Invalid destination. Choose Station A or Station B.";
  if (!snapshot.robot.connected || snapshot.robot.status === "offline")
    return "Robot is disconnected. Reconnect before dispatching.";
  if (isStale(snapshot.robot, now))
    return snapshot.robot.api_received_at
      ? "API telemetry is stale. Refresh the backend connection."
      : "Telemetry is stale. Wait for a fresh robot heartbeat.";
  if (snapshot.manual || snapshot.robot.status === "manual")
    return "Disable manual mode before starting an autonomous mission.";
  if (activeMission(snapshot) || snapshot.robot.status === "busy")
    return "Robot is busy. Complete or cancel the current mission first.";
  return null;
}
export function missionDuration(mission: Mission) {
  if (!mission.started_at || !mission.finished_at) return null;
  const duration =
    (Date.parse(mission.finished_at) - Date.parse(mission.started_at)) / 1000;
  return Number.isFinite(duration) ? Math.max(0, duration) : null;
}
export function fleetMetrics(missions: Mission[]) {
  const completed = missions.filter((m) => m.status === "completed");
  const finished = missions.filter((m) =>
    ["completed", "failed", "canceled"].includes(m.status),
  );
  const durations = completed
    .map(missionDuration)
    .filter((n): n is number => n !== null);
  return {
    total: missions.length,
    completed: completed.length,
    active: missions.filter((m) => ["queued", "running"].includes(m.status))
      .length,
    successRate: finished.length
      ? Math.round((completed.length / finished.length) * 100)
      : 0,
    averageSeconds: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0,
  };
}
export function hourlyActivity(missions: Mission[], now: number, hours = 8) {
  const end = new Date(now);
  end.setMinutes(0, 0, 0);
  return Array.from({ length: hours }, (_, index) => {
    const start = end.getTime() - (hours - 1 - index) * 3_600_000;
    const bucket = missions.filter((m) => {
      const timestamp = Date.parse(m.created_at);
      return timestamp >= start && timestamp < start + 3_600_000;
    });
    return {
      label: new Date(start).toLocaleTimeString("en", {
        hour: "2-digit",
        hour12: false,
      }),
      completed: bucket.filter((m) => m.status === "completed").length,
      other: bucket.filter((m) => m.status !== "completed").length,
    };
  });
}
export function csvMissions(missions: Mission[]) {
  // Quote delimiters and prefix formula-like fields before opening in a spreadsheet.
  const cell = (value: unknown) =>
    `"${String(value ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  return [
    [
      "Task ID",
      "Robot ID",
      "Destination",
      "Status",
      "Progress",
      "Created",
      "Updated",
      "Error",
    ],
    ...missions.map((m) => [
      m.task_id,
      m.robot_id,
      m.destination,
      m.status,
      m.progress,
      m.created_at,
      m.updated_at,
      m.error,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
