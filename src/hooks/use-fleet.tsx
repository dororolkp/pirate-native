import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import {
  API_BASE,
  ApiFleetService,
  DemoCommand,
  DemoFleetService,
  FleetService,
} from "../lib/fleet-service";
import { FleetSnapshot, StationId } from "../lib/fleet-domain";
import { activityStore, ActivityCode } from "../lib/activity-store";

function record(code: ActivityCode, outcome: "ok" | "failed" | "info") {
  void activityStore
    .record(code, outcome, API_BASE ? "live" : "demo")
    .catch(() => undefined);
}

function useFleetController() {
  const [snapshot, setSnapshot] = useState<FleetSnapshot | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [pending, setPending] = useState(false);
  const service = useRef<FleetService | null>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    let alive = true;
    let previousIssue: boolean | undefined;
    let previousTasks = new Map<string, string>();
    record("workspace_opened", "info");
    const instance: FleetService = API_BASE
      ? new ApiFleetService(API_BASE)
      : new DemoFleetService();
    service.current = instance;
    const stop = instance.subscribe((data, issue) => {
      if (!alive) return;
      const unhealthy = Boolean(API_BASE && issue);
      if (previousIssue !== undefined && previousIssue !== unhealthy)
        record(
          unhealthy ? "telemetry_unavailable" : "telemetry_recovered",
          unhealthy ? "failed" : "ok",
        );
      previousIssue = unhealthy;
      for (const task of data.missions) {
        const previous = previousTasks.get(task.task_id);
        if (previous && previous !== task.status && task.status !== "queued")
          record(
            `mission_${task.status}` as ActivityCode,
            task.status === "failed" ? "failed" : "ok",
          );
      }
      previousTasks = new Map(
        data.missions.map((task) => [task.task_id, task.status]),
      );
      setSnapshot(data);
      setNow(Date.now());
      setConnectionError(Boolean(API_BASE && issue));
      setTelemetryError(issue ?? null);
    });
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const appState = AppState.addEventListener("change", (state) => {
      instance.setActive?.(state === "active");
      const update =
        state === "active"
          ? instance.refresh()
          : !API_BASE
            ? instance.demo("manual-off")
            : undefined;
      // Never retain demo manual mode when the app is backgrounded.
      void update?.catch(() => {
        if (alive)
          setError(
            "Workspace update failed. Refresh telemetry before continuing.",
          );
      });
    });
    return () => {
      mounted.current = false;
      alive = false;
      stop();
      clearInterval(clock);
      appState.remove();
      service.current = null;
    };
  }, []);
  async function act(
    action: (instance: FleetService) => Promise<void>,
    success: string,
    code: ActivityCode,
  ) {
    if (!service.current || busy.current) return false;
    busy.current = true;
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await action(service.current);
      record(code, "ok");
      if (mounted.current) setNotice(success);
      return true;
    } catch (issue) {
      record(code, "failed");
      if (mounted.current)
        setError(
          issue instanceof Error
            ? issue.message
            : "Command failed. Check current status.",
        );
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return {
    snapshot,
    now,
    error: telemetryError || error,
    notice,
    pending,
    connectionError,
    isLive: Boolean(API_BASE),
    dismiss: () => {
      setError(null);
      setTelemetryError(null);
      setNotice(null);
    },
    dispatch: (destination: StationId) =>
      act(
        (s) => s.dispatch(destination),
        "Mission accepted. Follow its progress on the map.",
        "mission_dispatch",
      ),
    cancel: (id: string) =>
      act(
        (s) => s.cancel(id),
        API_BASE
          ? "Cancellation requested. Waiting for backend acknowledgment."
          : "Mission canceled. Simulated motion stopped.",
        "mission_cancel",
      ),
    demo: (command: DemoCommand) =>
      act(
        (s) => s.demo(command),
        command === "reset"
          ? "Demo reset. Sample missions restored."
          : "Simulation updated.",
        "demo_control",
      ),
    refresh: () =>
      act(
        (s) => s.refresh(),
        "Telemetry refresh requested.",
        "telemetry_refresh",
      ),
  };
}
export type FleetController = ReturnType<typeof useFleetController>;
const Context = createContext<FleetController | null>(null);
export function FleetProvider({ children }: PropsWithChildren) {
  const fleet = useFleetController();
  return <Context.Provider value={fleet}>{children}</Context.Provider>;
}
export function useFleet() {
  const context = useContext(Context);
  if (!context) throw new Error("FleetProvider is required.");
  return context;
}
