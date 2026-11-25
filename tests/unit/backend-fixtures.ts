import type { BackendRobot, BackendTask } from "../../src/lib/backend-contract";

export function backendRobot(): BackendRobot {
  return {
    robot_id: "robot_01",
    connected: true,
    state: "idle",
    current_task_id: null,
    pose: { x: -4, y: 0, theta: 0 },
    updated_at: new Date().toISOString(),
  };
}
export function backendTask(overrides: Partial<BackendTask> = {}): BackendTask {
  const time = new Date().toISOString();
  return {
    task_id: "t_01",
    robot_id: "robot_01",
    destination: "station_b",
    state: "running",
    progress: 0.2,
    error: null,
    created_at: time,
    updated_at: time,
    started_at: time,
    finished_at: null,
    ...overrides,
  };
}
