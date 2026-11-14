import { randomUUID } from "expo-crypto";
import {
  activeMission,
  dispatchError,
  FleetSnapshot,
  Mission,
  Scenario,
  StationId,
  STATIONS,
} from "./fleet-domain";

const iso = (time: number) => new Date(time).toISOString();
export function addEvent(
  snapshot: FleetSnapshot,
  message: string,
  level: "info" | "success" | "warning" | "error",
  now: number,
  taskId?: string,
) {
  snapshot.events.unshift({
    event_id: randomUUID(),
    robot_id: snapshot.robot.robot_id,
    task_id: taskId,
    timestamp: iso(now),
    level,
    message,
  });
  snapshot.events = snapshot.events.slice(0, 60);
}
/** Seeded examples never represent actual robot operations. */
export function createDemo(now = Date.now()): FleetSnapshot {
  const missions: Mission[] = Array.from(
    { length: 24 },
    (_, index): Mission => {
      const created = now - (24 - index) * 18 * 60_000;
      const status =
        index === 9 ? "failed" : index === 16 ? "canceled" : "completed";
      return {
        task_id: `demo_${String(index + 1).padStart(3, "0")}`,
        robot_id: "robot_01",
        destination: index % 2 ? "station_a" : "station_b",
        origin: { x: 140, y: 220 },
        status,
        progress: status === "completed" ? 100 : 40,
        created_at: iso(created),
        started_at: iso(created + 1000),
        updated_at: iso(created + 25_000 + (index % 6) * 1000),
        finished_at: iso(created + 25_000 + (index % 6) * 1000),
        error: status === "failed" ? "Demo navigation timeout" : undefined,
      };
    },
  ).reverse();
  const snapshot: FleetSnapshot = {
    robot: {
      robot_id: "robot_01",
      name: "Atlas",
      connected: true,
      status: "idle",
      pose: { x: 140, y: 220, yaw: 0 },
      battery: 86,
      heartbeat_at: iso(now),
    },
    missions,
    events: [],
    manual: false,
    scenario: "normal",
  };
  addEvent(
    snapshot,
    "Simulation initialized. 24 sample missions loaded.",
    "info",
    now - 1000,
  );
  addEvent(snapshot, "Atlas connected. Ready at Station A.", "success", now);
  return snapshot;
}
export function createMission(
  snapshot: FleetSnapshot,
  destination: StationId,
  now = Date.now(),
) {
  const error = dispatchError(snapshot, destination, now);
  if (error) throw new Error(error);
  const task: Mission = {
    task_id: `task_${randomUUID().slice(0, 8)}`,
    robot_id: snapshot.robot.robot_id,
    destination,
    origin: { x: snapshot.robot.pose.x, y: snapshot.robot.pose.y },
    status: "queued",
    progress: 0,
    created_at: iso(now),
    updated_at: iso(now),
  };
  snapshot.missions.unshift(task);
  snapshot.missions = snapshot.missions.slice(0, 200);
  snapshot.robot.status = "busy";
  addEvent(
    snapshot,
    `Mission queued for ${STATIONS[destination].label}.`,
    "info",
    now,
    task.task_id,
  );
  return task;
}
export function cancelMission(
  snapshot: FleetSnapshot,
  taskId: string,
  now = Date.now(),
) {
  const task = snapshot.missions.find((m) => m.task_id === taskId);
  if (!task || !["queued", "running"].includes(task.status))
    throw new Error("This mission is no longer active.");
  task.status = "canceled";
  task.updated_at = task.finished_at = iso(now);
  snapshot.robot.status = snapshot.robot.connected ? "idle" : "offline";
  addEvent(
    snapshot,
    "Cancellation acknowledged. Simulated robot stopped.",
    "warning",
    now,
    taskId,
  );
}
export function setConnection(
  snapshot: FleetSnapshot,
  connected: boolean,
  now = Date.now(),
) {
  const task = activeMission(snapshot);
  snapshot.robot.connected = connected;
  snapshot.manual = false;
  if (task && !connected) {
    task.status = "failed";
    task.error = "Robot disconnected during mission. Simulated motion stopped.";
    task.updated_at = task.finished_at = iso(now);
  }
  snapshot.robot.status = connected
    ? activeMission(snapshot)
      ? "busy"
      : "idle"
    : "offline";
  if (connected) snapshot.robot.heartbeat_at = iso(now);
  addEvent(
    snapshot,
    connected
      ? "Robot reconnected. Fresh telemetry received."
      : "Connection lost. Dispatch and manual controls disabled.",
    connected ? "success" : "error",
    now,
    task?.task_id,
  );
}
export function setManual(
  snapshot: FleetSnapshot,
  enabled: boolean,
  now = Date.now(),
) {
  if (enabled && (!snapshot.robot.connected || isBusy(snapshot)))
    throw new Error("Manual mode requires an online, idle robot.");
  snapshot.manual = enabled;
  snapshot.robot.status = enabled
    ? "manual"
    : snapshot.robot.connected
      ? activeMission(snapshot)
        ? "busy"
        : "idle"
      : "offline";
  addEvent(
    snapshot,
    enabled
      ? "Demo manual mode enabled. Autonomous dispatch locked."
      : "Manual mode disabled.",
    "info",
    now,
  );
}
const isBusy = (snapshot: FleetSnapshot) =>
  Boolean(activeMission(snapshot) || snapshot.robot.status === "busy");
export function stopSimulation(snapshot: FleetSnapshot, now = Date.now()) {
  const task = activeMission(snapshot);
  if (task) cancelMission(snapshot, task.task_id, now);
  snapshot.manual = false;
  snapshot.robot.status = snapshot.robot.connected ? "idle" : "offline";
  addEvent(
    snapshot,
    "Simulation stop acknowledged. Manual mode cleared.",
    "warning",
    now,
    task?.task_id,
  );
}
export function moveManual(
  snapshot: FleetSnapshot,
  dx: number,
  dy: number,
  now = Date.now(),
) {
  if (!snapshot.manual || !snapshot.robot.connected || isBusy(snapshot))
    throw new Error("Enable demo manual mode on an idle, connected robot.");
  // Discrete bounded map steps, not a live velocity or deadman command.
  snapshot.robot.pose.x = Math.max(
    110,
    Math.min(690, snapshot.robot.pose.x + dx * 12),
  );
  snapshot.robot.pose.y = Math.max(
    195,
    Math.min(245, snapshot.robot.pose.y + dy * 12),
  );
  snapshot.robot.pose.yaw = Math.atan2(dy, dx);
  snapshot.robot.heartbeat_at = iso(now);
}
export function setScenario(
  snapshot: FleetSnapshot,
  scenario: Scenario,
  now = Date.now(),
) {
  if (isBusy(snapshot))
    throw new Error("Change scenarios only while the robot is idle.");
  snapshot.scenario = scenario;
  addEvent(snapshot, `Demo scenario selected: ${scenario}.`, "info", now);
}
export function tickDemo(snapshot: FleetSnapshot, now = Date.now()) {
  if (!snapshot.robot.connected) return;
  snapshot.robot.heartbeat_at = iso(now);
  const task = activeMission(snapshot);
  if (!task) return;
  const elapsed = now - Date.parse(task.created_at);
  if (elapsed >= 1000 && task.status === "queued") {
    task.status = "running";
    task.started_at = iso(Date.parse(task.created_at) + 1000);
    addEvent(
      snapshot,
      "Navigation started. Following warehouse corridor.",
      "info",
      now,
      task.task_id,
    );
  }
  if (task.status !== "running") return;
  const motionTime = Math.max(0, elapsed - 1000);
  const obstacle = snapshot.scenario === "obstacle";
  const effectiveTime = obstacle
    ? motionTime - Math.min(4000, Math.max(0, motionTime - 6000))
    : motionTime;
  if (
    obstacle &&
    motionTime >= 6000 &&
    motionTime < 10_000 &&
    !snapshot.events.some(
      (e) => e.task_id === task.task_id && e.message.startsWith("Obstacle"),
    )
  ) {
    addEvent(
      snapshot,
      "Obstacle detected. Demo motion paused for 4 seconds before recovery.",
      "warning",
      now,
      task.task_id,
    );
  }
  task.progress = Math.min(
    snapshot.scenario === "timeout" ? 55 : 100,
    Math.round((effectiveTime / 18_000) * 100),
  );
  const station = STATIONS[task.destination];
  snapshot.robot.pose.x =
    task.origin.x + ((station.x - task.origin.x) * task.progress) / 100;
  snapshot.robot.pose.y =
    task.origin.y + ((station.y - task.origin.y) * task.progress) / 100;
  snapshot.robot.pose.yaw = station.x >= task.origin.x ? 0 : Math.PI;
  task.updated_at = iso(now);
  if (snapshot.scenario === "timeout" && elapsed >= 15_000) {
    task.status = "failed";
    task.error =
      "Navigation timed out after 15 seconds. Simulated motion stopped.";
    task.finished_at = iso(now);
    snapshot.robot.status = "idle";
    addEvent(snapshot, task.error, "error", now, task.task_id);
  } else if (task.progress === 100) {
    task.status = "completed";
    task.finished_at = iso(now);
    snapshot.robot.status = "idle";
    snapshot.robot.battery = Math.max(10, snapshot.robot.battery - 1);
    addEvent(
      snapshot,
      `Delivery completed at ${station.label}.`,
      "success",
      now,
      task.task_id,
    );
  }
}
