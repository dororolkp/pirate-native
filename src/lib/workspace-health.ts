import { FleetSnapshot, isStale } from "./fleet-domain";

export function workspaceHealth(
  snapshot: FleetSnapshot,
  now: number,
  isLive: boolean,
  connectionError: boolean,
) {
  if (connectionError)
    return {
      label: "Telemetry unavailable",
      tone: "red" as const,
      detail: "Refresh the connection before dispatching.",
    };
  if (!snapshot.robot.connected)
    return {
      label: "Robot disconnected",
      tone: "red" as const,
      detail: "Reconnect before planning another mission.",
    };
  if (isStale(snapshot.robot, now))
    return {
      label: "Stale heartbeat",
      tone: "orange" as const,
      detail: "Wait for fresh telemetry. Dispatch is blocked.",
    };
  if (snapshot.manual)
    return {
      label: "Manual mode active",
      tone: "orange" as const,
      detail: "Disable manual mode before autonomous missions.",
    };
  return {
    label: isLive ? "Live telemetry current" : "Local simulation ready",
    tone: "green" as const,
    detail: isLive
      ? "David's backend data is authoritative. Its selected adapter handles A/B navigation."
      : "Practice safely. No physical robot is connected.",
  };
}
