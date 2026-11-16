import { z } from "zod";

// Verified against Gazebo-Simulator/car_controls.py at b0f69479.
export const GAZEBO_PROFILE = {
  world: "shapes",
  model: "hatchback_blue",
  wheelbase: 2.5165,
  steeringLimit: 0.45,
  minSpeed: 0.2,
  maxSpeed: 2,
  commandTopic: "/model/hatchback_blue/cmd_vel",
  poseTopic: "/world/shapes/pose/info",
} as const;

export type DriveAction = "forward" | "reverse" | "left" | "right" | "stop";
export const driveCommandSchema = z
  .object({
    model: z.literal("hatchback_blue"),
    linear_x: z.number().finite().min(-2).max(2),
    angular_z: z.number().finite(),
    lease_ms: z.literal(250),
    sequence: z.number().int().nonnegative(),
  })
  .strict();
export type DriveCommand = z.infer<typeof driveCommandSchema>;

export function previewDrive(
  action: DriveAction,
  speed: number,
  sequence = 0,
): DriveCommand {
  if (!Number.isFinite(speed) || speed < 0.2 || speed > 2) {
    throw new Error("Preview speed must be between 0.2 and 2.0 m/s.");
  }
  const velocity =
    action === "stop" ? 0 : action === "reverse" ? -speed : speed;
  const steering = action === "left" ? 0.45 : action === "right" ? -0.45 : 0;
  return driveCommandSchema.parse({
    model: GAZEBO_PROFILE.model,
    linear_x: velocity,
    angular_z: (velocity * Math.tan(steering)) / GAZEBO_PROFILE.wheelbase,
    lease_ms: 250,
    sequence,
  });
}

// A future gateway implements this boundary inside this monolith.
// No HTTP/WebSocket implementation is shipped or selected by the UI.
export interface GazeboGateway {
  acquireControl(): Promise<{ lease_id: string }>;
  send(command: DriveCommand, leaseId: string): Promise<void>;
  releaseControl(leaseId: string): Promise<void>;
}

export const gazeboTelemetrySchema = z.object({
  model: z.literal("hatchback_blue"),
  world: z.literal("shapes"),
  frame: z.literal("world"),
  unit: z.literal("meters"),
  observed_at: z.string().datetime(),
  connected: z.boolean(),
  pose: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    yaw: z.number().finite(),
  }),
});
