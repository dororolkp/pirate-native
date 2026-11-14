import { describe, expect, it } from "vitest";
import {
  activeMission,
  csvMissions,
  dispatchError,
  fleetMetrics,
  hourlyActivity,
  isStale,
} from "../../src/lib/fleet-domain";
import {
  cancelMission,
  createDemo,
  createMission,
  moveManual,
  setConnection,
  setManual,
  setScenario,
  stopSimulation,
  tickDemo,
} from "../../src/lib/demo-simulator";

const NOW = Date.parse("2026-11-14T12:00:00.000Z");
describe("Fleet simulation lifecycle", () => {
  it("seeds 24 explicitly simulated records with real timestamp metrics", () => {
    const fleet = createDemo(NOW);
    expect(fleetMetrics(fleet.missions)).toMatchObject({
      total: 24,
      completed: 22,
      active: 0,
      successRate: 92,
    });
    expect(fleet.events.some((e) => e.message.includes("sample"))).toBe(true);
    expect(fleetMetrics([])).toEqual({
      total: 0,
      completed: 0,
      active: 0,
      successRate: 0,
      averageSeconds: 0,
    });
  });
  it("transitions queued, running, completed and reaches Station B", () => {
    const fleet = createDemo(NOW);
    const task = createMission(fleet, "station_b", NOW);
    expect(task.status).toBe("queued");
    tickDemo(fleet, NOW + 1000);
    expect(task.status).toBe("running");
    tickDemo(fleet, NOW + 10_000);
    expect(task.progress).toBe(50);
    expect(fleet.robot.pose.x).toBe(400);
    tickDemo(fleet, NOW + 19_000);
    expect(task.status).toBe("completed");
    expect(fleet.robot.pose.x).toBe(660);
    expect(activeMission(fleet)).toBeUndefined();
    expect(task.finished_at).toBe(new Date(NOW + 19_000).toISOString());
  });
  it("resumes elapsed demo time without inventing a delayed start timestamp", () => {
    const fleet = createDemo(NOW);
    const task = createMission(fleet, "station_b", NOW);
    tickDemo(fleet, NOW + 30_000);
    expect(task.started_at).toBe(new Date(NOW + 1000).toISOString());
    expect(task.status).toBe("completed");
  });
  it.each([100, 5000])(
    "cancels queued/running motion at %dms without resuming",
    (elapsed) => {
      const fleet = createDemo(NOW);
      const task = createMission(fleet, "station_b", NOW);
      tickDemo(fleet, NOW + elapsed);
      const x = fleet.robot.pose.x;
      cancelMission(fleet, task.task_id, NOW + elapsed);
      tickDemo(fleet, NOW + 50_000);
      expect(task.status).toBe("canceled");
      expect(fleet.robot.pose.x).toBe(x);
      expect(() => cancelMission(fleet, task.task_id, NOW + 60_000)).toThrow(
        "no longer active",
      );
    },
  );
  it("pauses once on an obstacle then recovers", () => {
    const fleet = createDemo(NOW);
    setScenario(fleet, "obstacle", NOW);
    const task = createMission(fleet, "station_b", NOW);
    tickDemo(fleet, NOW + 7000);
    const x = fleet.robot.pose.x;
    tickDemo(fleet, NOW + 9000);
    expect(fleet.robot.pose.x).toBe(x);
    expect(
      fleet.events.filter((e) => e.message.startsWith("Obstacle")),
    ).toHaveLength(1);
    tickDemo(fleet, NOW + 23_000);
    expect(task.status).toBe("completed");
  });
  it("fails timeout and permanently stops motion for that task", () => {
    const fleet = createDemo(NOW);
    setScenario(fleet, "timeout", NOW);
    const task = createMission(fleet, "station_b", NOW);
    tickDemo(fleet, NOW + 15_000);
    expect(task.status).toBe("failed");
    const x = fleet.robot.pose.x;
    tickDemo(fleet, NOW + 90_000);
    expect(fleet.robot.pose.x).toBe(x);
  });
  it("fails active work on disconnect and never silently resumes on reconnect", () => {
    const fleet = createDemo(NOW);
    const task = createMission(fleet, "station_b", NOW);
    tickDemo(fleet, NOW + 4000);
    const x = fleet.robot.pose.x;
    setConnection(fleet, false, NOW + 5000);
    setConnection(fleet, true, NOW + 6000);
    tickDemo(fleet, NOW + 25_000);
    expect(task.status).toBe("failed");
    expect(fleet.robot.pose.x).toBe(x);
    expect(dispatchError(fleet, "station_a", NOW + 25_000)).toBeNull();
  });
  it("stops active work and clears manual mode", () => {
    const fleet = createDemo(NOW);
    const task = createMission(fleet, "station_b", NOW);
    stopSimulation(fleet, NOW + 100);
    expect(task.status).toBe("canceled");
    setManual(fleet, true, NOW + 200);
    stopSimulation(fleet, NOW + 300);
    expect(fleet.manual).toBe(false);
  });
});
describe("Guards, bounded manual motion, analytics and CSV", () => {
  it("rejects inherited/invalid destinations, offline, manual, busy and stale state", () => {
    const fleet = createDemo(NOW);
    expect(dispatchError(fleet, "toString", NOW)).toContain("Invalid");
    expect(dispatchError(fleet, "station_c", NOW)).toContain("Invalid");
    expect(dispatchError(fleet, "station_b", NOW + 10_001)).toContain("stale");
    fleet.robot.status = "manual";
    expect(dispatchError(fleet, "station_b", NOW)).toContain("manual");
    fleet.robot.status = "offline";
    expect(dispatchError(fleet, "station_b", NOW)).toContain("disconnected");
    fleet.robot.status = "busy";
    expect(dispatchError(fleet, "station_b", NOW)).toContain("busy");
  });
  it("rejects invalid and implausibly future heartbeat timestamps", () => {
    const fleet = createDemo(NOW);
    fleet.robot.heartbeat_at = "bad";
    expect(isStale(fleet.robot, NOW)).toBe(true);
    fleet.robot.heartbeat_at = new Date(NOW + 60_000).toISOString();
    expect(isStale(fleet.robot, NOW)).toBe(true);
  });
  it("enforces exclusivity and manual boundaries", () => {
    const fleet = createDemo(NOW);
    setManual(fleet, true, NOW);
    expect(() => createMission(fleet, "station_b", NOW)).toThrow("manual");
    for (let i = 0; i < 100; i++) moveManual(fleet, -1, -1, NOW);
    expect(fleet.robot.pose).toMatchObject({ x: 110, y: 195 });
    setManual(fleet, false, NOW);
    createMission(fleet, "station_b", NOW);
    expect(() => setManual(fleet, true, NOW)).toThrow("idle");
    expect(() => setScenario(fleet, "timeout", NOW)).toThrow("idle");
    expect(() => createMission(fleet, "station_a", NOW)).toThrow("busy");
  });
  it("excludes active tasks from success-rate denominator", () => {
    const fleet = createDemo(NOW);
    createMission(fleet, "station_b", NOW);
    expect(fleetMetrics(fleet.missions)).toMatchObject({
      total: 25,
      active: 1,
      successRate: 92,
    });
  });
  it("counts actual timestamp buckets", () => {
    const fleet = createDemo(NOW);
    // Eight inclusive clock-hour buckets begin at 05:00; the 04:48 seed is excluded.
    expect(
      hourlyActivity(fleet.missions, NOW, 8).reduce(
        (sum, d) => sum + d.completed + d.other,
        0,
      ),
    ).toBe(23);
  });
  it("quotes CSV and protects formula-like values", () => {
    const fleet = createDemo(NOW);
    fleet.missions[0].error = '=SUM(1,2) "unsafe"\ntext';
    expect(csvMissions([fleet.missions[0]])).toContain("'=SUM(1,2)");
    expect(csvMissions([fleet.missions[0]])).toContain('""unsafe""');
  });
});
