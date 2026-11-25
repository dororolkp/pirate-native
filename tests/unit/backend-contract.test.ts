import { describe, expect, it } from "vitest";
import {
  adaptRobot,
  adaptTask,
  backendTaskSchema,
  normalizeBackendUrl,
  WORLD_STATIONS,
  worldToMap,
} from "../../src/lib/backend-contract";
import { dispatchError, isStale } from "../../src/lib/fleet-domain";
import { emptyLiveSnapshot } from "../../src/lib/fleet-service";
import { backendRobot, backendTask } from "./backend-fixtures";

describe("David's REST contract", () => {
  it("converts metres to a uniform 2D scale, flips Y and preserves radians", () => {
    expect(worldToMap(WORLD_STATIONS.station_a)).toEqual({
      x: 500,
      y: 255,
      yaw: -0,
    });
    expect(worldToMap(WORLD_STATIONS.station_b)).toEqual({
      x: 300,
      y: 135,
      yaw: -0,
    });
    const origin = worldToMap({ x: 0, y: 0, theta: Math.PI / 2 });
    const diagonal = worldToMap({ x: 1, y: 1, theta: 0 });
    expect(diagonal.x - origin.x).toBe(20);
    expect(diagonal.y - origin.y).toBe(-20);
    expect(origin.yaw).toBe(-Math.PI / 2);
  });
  it("preserves world poses and does not invent battery values", () => {
    const raw = backendRobot();
    expect(adaptRobot(raw)).toMatchObject({
      worldPose: raw.pose,
      battery: null,
      heartbeat_at: raw.updated_at,
    });
  });
  it("distinguishes a fresh idle API read from an old pose update", () => {
    const raw = backendRobot();
    raw.updated_at = "2020-01-01T00:00:00Z";
    const now = Date.now();
    const robot = adaptRobot(raw, now);
    expect(robot.heartbeat_at).toBe(raw.updated_at);
    expect(isStale(robot, now)).toBe(false);
    expect(isStale(robot, now + 10_001)).toBe(true);
    const snapshot = { ...emptyLiveSnapshot(), robot };
    expect(dispatchError(snapshot, "station_b", now)).toBeNull();
  });
  it("maps nullable timestamps, state and fractional progress", () => {
    const task = adaptTask(
      backendTask({ progress: 0.437, started_at: null, error: null }),
    );
    expect(task).toMatchObject({ status: "running", progress: 44 });
    expect(task.started_at).toBeUndefined();
    expect(task.finished_at).toBeUndefined();
    expect(task.error).toBeUndefined();
  });
  it("rejects progress outside the backend 0–1 range", () => {
    expect(() =>
      backendTaskSchema.parse(backendTask({ progress: 40 })),
    ).toThrow();
  });
  it("normalizes server base URLs", () => {
    expect(normalizeBackendUrl(" http://localhost:8000/// ")).toBe(
      "http://localhost:8000",
    );
  });
  it.each([
    "ftp://localhost",
    "https://user:secret@server.test",
    "https://server.test?token=secret",
    "https://server.test/api/v1",
    "not a URL",
  ])("rejects unsafe or incorrectly scoped URL %s", (value) =>
    expect(() => normalizeBackendUrl(value)).toThrow(),
  );
});
