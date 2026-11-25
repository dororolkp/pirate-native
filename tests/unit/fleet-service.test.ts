import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiFleetService, DemoFleetService } from "../../src/lib/fleet-service";
import { FleetSnapshot } from "../../src/lib/fleet-domain";
import { createDemo } from "../../src/lib/demo-simulator";
import { backendRobot, backendTask } from "./backend-fixtures";
import type { BackendRobot } from "../../src/lib/backend-contract";

const response = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));
describe("Cross-platform HTTP adapter", () => {
  let fetcher: ReturnType<typeof vi.fn>;
  let service: ApiFleetService;
  let snapshot: FleetSnapshot | undefined;
  let issue: string | undefined;
  let stop: (() => void) | undefined;
  let robot: BackendRobot;
  beforeEach(() => {
    robot = backendRobot();
    snapshot = undefined;
    issue = undefined;
    fetcher = vi
      .fn()
      .mockImplementation((url: string) =>
        response(url.includes("?") ? [] : [robot]),
      );
    vi.stubGlobal("fetch", fetcher);
    service = new ApiFleetService("https://robot.example");
  });
  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.unstubAllGlobals();
  });
  async function connect() {
    stop = service.subscribe((data, error) => {
      snapshot = data;
      issue = error;
    });
    await vi.waitFor(() => expect(snapshot).toBeDefined());
  }
  it("uses authoritative heartbeat and documented URLs", async () => {
    await connect();
    expect(snapshot?.robot.heartbeat_at).toBe(robot.updated_at);
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://robot.example/api/v1/robots",
    );
  });
  it("rejects undocumented wrapped robot snapshots", async () => {
    fetcher.mockImplementation(() => response({ robots: [robot] }));
    await connect();
    expect(issue).toContain("documented contract");
  });
  it("does not fall back to demo on malformed or unavailable API", async () => {
    fetcher.mockImplementation(() => response([{ battery: 999 }]));
    await connect();
    expect(issue).toContain("documented contract");
    expect(snapshot?.robot.connected).toBe(false);
    expect(snapshot?.missions).toHaveLength(0);
    await expect(service.dispatch("station_b")).rejects.toThrow("Connection");
  });
  it("retains accepted IDs if task delivery fails, without duplicating POST", async () => {
    await connect();
    fetcher.mockImplementation((url: string, options: RequestInit) => {
      if (options.method === "POST")
        return response({ task_id: "t_01", state: "queued" }, 201);
      if (url.endsWith("/robots")) return response([robot]);
      return Promise.reject(new Error("Status delivery interrupted"));
    });
    await service.dispatch("station_b");
    expect(snapshot?.missions[0].task_id).toBe("t_01");
    expect(issue).toContain("interrupted");
    expect(
      fetcher.mock.calls.filter(([, options]) => options.method === "POST"),
    ).toHaveLength(1);
  });
  it("locks dispatch after an ambiguous result even after healthy refresh", async () => {
    await connect();
    fetcher.mockRejectedValueOnce(new Error("Command timeout"));
    await expect(service.dispatch("station_b")).rejects.toThrow("timeout");
    await service.refresh();
    await expect(service.dispatch("station_a")).rejects.toThrow("unknown");
    expect(issue).toContain("locked");
    expect(
      fetcher.mock.calls.filter(([, options]) => options.method === "POST"),
    ).toHaveLength(1);
  });
  it("does not optimistically acknowledge live cancellation", async () => {
    await connect();
    const task = backendTask();
    fetcher.mockImplementation((url: string, options: RequestInit) => {
      if (options.method === "POST" && url.endsWith("/tasks"))
        return response({ task_id: "t_01", state: "queued" }, 201);
      if (options.method === "POST")
        return response({ state: "cancel_requested" });
      if (url.endsWith("/robots")) return response([robot]);
      return response(url.includes("?") ? [task] : task);
    });
    await service.dispatch("station_b");
    await expect(service.cancel("t_01")).rejects.toThrow();
    expect(snapshot?.missions[0].status).toBe("running");
    task.state = "canceled";
    await service.refresh();
    expect(snapshot?.missions[0].status).toBe("canceled");
  });
  it("rejects cross-robot task snapshots", async () => {
    await connect();
    fetcher.mockImplementation((url: string, options: RequestInit) => {
      if (options.method === "POST")
        return response({ task_id: "t_01", state: "queued" }, 201);
      if (url.endsWith("/robots")) return response([robot]);
      return response({
        ...backendTask(),
        task_id: "t_01",
        robot_id: "wrong",
      });
    });
    await service.dispatch("station_b");
    expect(issue).toContain("different robot");
    expect(snapshot?.missions[0].status).toBe("queued");
  });
  it("prevents duplicate concurrent commands", async () => {
    await connect();
    let accept!: (response: Response) => void;
    fetcher.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          accept = resolve;
        }),
    );
    const first = service.dispatch("station_b");
    await expect(service.dispatch("station_a")).rejects.toThrow("pending");
    accept(new Response(JSON.stringify({ task_id: "t_01", state: "queued" })));
    fetcher.mockImplementation((url: string) =>
      response(url.includes("?") ? [] : [robot]),
    );
    await first;
    expect(snapshot?.missions[0].task_id).toBe("t_01");
  });
  it("rejects live simulation controls", async () => {
    await expect(service.demo()).rejects.toThrow("unavailable");
  });
  it("restores an existing backend mission on initial connection", async () => {
    robot.state = "busy";
    robot.current_task_id = "t_01";
    const task = backendTask();
    fetcher.mockImplementation((url: string) =>
      response(
        url.endsWith("/robots") ? [robot] : url.includes("?") ? [task] : task,
      ),
    );
    await connect();
    expect(snapshot?.missions[0]).toMatchObject({
      task_id: "t_01",
      status: "running",
      progress: 20,
    });
    await expect(service.dispatch("station_a")).rejects.toThrow("busy");
    expect(service.canSwitch()).toBe(false);
  });
  it("acknowledges cancellation only for the matching task and robot", async () => {
    robot.state = "busy";
    robot.current_task_id = "t_01";
    let task = backendTask();
    fetcher.mockImplementation((url: string, options: RequestInit) => {
      if (options.method === "POST") {
        task = backendTask({
          state: "canceled",
          finished_at: new Date().toISOString(),
        });
        robot.state = "idle";
        robot.current_task_id = null;
        return response(task);
      }
      return response(
        url.endsWith("/robots") ? [robot] : url.includes("?") ? [task] : task,
      );
    });
    await connect();
    await service.cancel("t_01");
    expect(snapshot?.missions[0].status).toBe("canceled");
    expect(service.canSwitch()).toBe(true);
  });
  it("does not lock the session after a definitive backend rejection", async () => {
    await connect();
    fetcher.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          detail: { code: "robot_busy", message: "Robot is busy" },
        }),
        { status: 409 },
      ),
    );
    await expect(service.dispatch("station_b")).rejects.toThrow(
      "Robot is busy",
    );
    expect(service.canSwitch()).toBe(true);
    await service.refresh();
    expect(issue).toBeUndefined();
  });
  it("polls at 500ms and limits idle history reads to every five seconds", async () => {
    vi.useFakeTimers();
    stop = service.subscribe(() => {});
    try {
      await service.refresh();
      await vi.advanceTimersByTimeAsync(2000);
      expect(
        fetcher.mock.calls.filter(([url]) => url.endsWith("/robots")),
      ).toHaveLength(5);
      expect(
        fetcher.mock.calls.filter(([url]) => url.includes("?")),
      ).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(3000);
      expect(
        fetcher.mock.calls.filter(([url]) => url.includes("?")),
      ).toHaveLength(2);
    } finally {
      stop();
      stop = undefined;
      vi.useRealTimers();
    }
  });
  it("does not resurrect running state from a read started before cancellation", async () => {
    robot.state = "busy";
    robot.current_task_id = "t_01";
    const running = backendTask();
    fetcher.mockImplementation((url: string) =>
      response(
        url.endsWith("/robots")
          ? [robot]
          : url.includes("?")
            ? [running]
            : running,
      ),
    );
    await connect();
    let deliver!: (value: Response) => void;
    fetcher.mockImplementation((url: string, options: RequestInit) => {
      if (options.method === "POST")
        return response(backendTask({ state: "canceled" }));
      if (url.endsWith("/robots")) return response([robot]);
      return new Promise<Response>((resolve) => {
        deliver = resolve;
      });
    });
    const reading = service.refresh();
    await vi.waitFor(() => expect(deliver).toBeDefined());
    const canceling = service.cancel("t_01");
    await vi.waitFor(() =>
      expect(snapshot?.missions[0].status).toBe("canceled"),
    );
    deliver(new Response(JSON.stringify(running)));
    await Promise.all([reading, canceling]);
    expect(snapshot?.missions[0].status).toBe("canceled");
  });
});
describe("Asynchronous native and web persistence", () => {
  let stop: (() => void) | undefined;
  beforeEach(() => {
    vi.mocked(AsyncStorage.getItem).mockReset().mockResolvedValue(null);
    vi.mocked(AsyncStorage.setItem).mockReset().mockResolvedValue();
  });
  afterEach(() => {
    stop?.();
    stop = undefined;
  });
  async function subscribe(service: DemoFleetService) {
    let snapshot: FleetSnapshot | undefined;
    let issue: string | undefined;
    stop = service.subscribe((data, error) => {
      snapshot = data;
      issue = error;
    });
    await vi.waitFor(() => expect(snapshot).toBeDefined());
    return { snapshot: () => snapshot, issue: () => issue };
  }
  it("recovers from corrupt saved state", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue("{bad");
    const state = await subscribe(new DemoFleetService());
    expect(state.snapshot()?.missions).toHaveLength(24);
    expect(state.issue()).toContain("could not be read");
  });
  it("reports storage failure without blocking simulation", async () => {
    vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error("quota"));
    const service = new DemoFleetService();
    const state = await subscribe(service);
    await vi.waitFor(() => expect(state.issue()).toContain("storage"));
    await expect(service.dispatch("station_b")).resolves.toBeUndefined();
    expect(state.snapshot()?.missions[0].status).toBe("queued");
  });
  it("clears restored manual mode", async () => {
    const saved = createDemo();
    saved.manual = true;
    saved.robot.status = "manual";
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(saved));
    const state = await subscribe(new DemoFleetService());
    expect(state.snapshot()?.manual).toBe(false);
    expect(state.snapshot()?.robot.status).toBe("idle");
  });
  it("waits for hydration before accepting a command", async () => {
    let hydrate!: (value: string | null) => void;
    vi.mocked(AsyncStorage.getItem).mockImplementation(
      () =>
        new Promise((resolve) => {
          hydrate = resolve;
        }),
    );
    const service = new DemoFleetService();
    const command = service.dispatch("station_b");
    hydrate(null);
    await command;
    const saved = JSON.parse(
      vi.mocked(AsyncStorage.setItem).mock.calls.at(-1)![1],
    );
    expect(saved.missions[0].destination).toBe("station_b");
    expect(saved.missions).toHaveLength(25);
  });
});

describe("Polling and persistence resource budgets", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it("keeps UI ticks responsive while throttling routine disk writes", async () => {
    vi.useFakeTimers();
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(AsyncStorage.setItem).mockReset().mockResolvedValue();
    const listener = vi.fn();
    const service = new DemoFleetService();
    const stop = service.subscribe(listener);
    try {
      await service.refresh();
      const baseline = vi.mocked(AsyncStorage.setItem).mock.calls.length;
      await vi.advanceTimersByTimeAsync(12_000);
      expect(listener.mock.calls.length).toBeGreaterThanOrEqual(24);
      expect(
        vi.mocked(AsyncStorage.setItem).mock.calls.length - baseline,
      ).toBeLessThanOrEqual(3);
      const previous = vi.mocked(AsyncStorage.setItem).mock.calls.length;
      await service.dispatch("station_b");
      expect(vi.mocked(AsyncStorage.setItem).mock.calls.length).toBe(
        previous + 1,
      );
    } finally {
      stop();
    }
  });
  it("backs off failed polling, recovers and pauses in the background", async () => {
    vi.useFakeTimers();
    const robot = backendRobot();
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockImplementation((url: string) =>
        response(url.includes("?") ? [] : [robot]),
      );
    vi.stubGlobal("fetch", fetcher);
    const service = new ApiFleetService("https://robot.example");
    const stop = service.subscribe(() => {});
    try {
      await service.refresh();
      expect(fetcher).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(2000);
      expect(fetcher).toHaveBeenCalledOnce();
      await vi.advanceTimersByTimeAsync(2000);
      expect(
        fetcher.mock.calls.filter(([url]) => url.endsWith("/robots")),
      ).toHaveLength(2);
      service.setActive(false);
      await vi.advanceTimersByTimeAsync(20_000);
      expect(
        fetcher.mock.calls.filter(([url]) => url.endsWith("/robots")),
      ).toHaveLength(2);
      service.setActive(true);
      await service.refresh();
      expect(
        fetcher.mock.calls.filter(([url]) => url.endsWith("/robots")),
      ).toHaveLength(3);
    } finally {
      stop();
    }
  });
});
