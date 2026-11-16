import { describe, expect, it } from "vitest";
import {
  gazeboTelemetrySchema,
  GAZEBO_PROFILE,
  previewDrive,
} from "../../src/lib/gazebo-contract";

describe("idle Gazebo integration contract", () => {
  it("matches the source model and transport topics", () => {
    expect(GAZEBO_PROFILE.model).toBe("hatchback_blue");
    expect(GAZEBO_PROFILE.commandTopic).toBe("/model/hatchback_blue/cmd_vel");
    expect(GAZEBO_PROFILE.poseTopic).toBe("/world/shapes/pose/info");
  });
  it("previews forward, reverse, stop and Ackermann arcs", () => {
    expect(previewDrive("forward", 1).linear_x).toBe(1);
    expect(previewDrive("reverse", 1).linear_x).toBe(-1);
    expect(previewDrive("left", 1).angular_z).toBeCloseTo(
      Math.tan(0.45) / 2.5165,
    );
    expect(previewDrive("right", 1).angular_z).toBeLessThan(0);
    expect(previewDrive("stop", 2)).toMatchObject({
      linear_x: 0,
      angular_z: 0,
      lease_ms: 250,
    });
  });
  it.each([NaN, Infinity, -1, 0, 2.1])("rejects invalid speeds %s", (value) => {
    expect(() => previewDrive("forward", value)).toThrow();
  });
  it("rejects warehouse map units as simulator telemetry", () => {
    expect(
      gazeboTelemetrySchema.safeParse({
        model: "hatchback_blue",
        world: "shapes",
        frame: "world",
        unit: "map_units",
        connected: true,
        observed_at: new Date().toISOString(),
        pose: { x: 140, y: 220, yaw: 0 },
      }).success,
    ).toBe(false);
  });
});
