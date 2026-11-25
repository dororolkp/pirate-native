// @vitest-environment jsdom
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDemo } from "../../src/lib/demo-simulator";
import type { FleetSnapshot } from "../../src/lib/fleet-domain";
import {
  FleetProvider,
  useFleet,
  type FleetController,
} from "../../src/hooks/use-fleet";

const mocks = vi.hoisted(() => ({
  apiBase: "",
  apiConstructor: vi.fn(),
  demoConstructor: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  dispatch: vi.fn(),
  cancel: vi.fn(),
  demo: vi.fn(),
  refresh: vi.fn(),
  addAppStateListener: vi.fn(),
  removeAppStateListener: vi.fn(),
  setActive: vi.fn(),
  recordActivity: vi.fn(),
}));
vi.mock("../../src/lib/activity-store", () => ({
  activityStore: { record: mocks.recordActivity },
}));
vi.mock("react-native", () => ({
  AppState: { addEventListener: mocks.addAppStateListener },
}));
vi.mock("../../src/lib/fleet-service", () => {
  class Service {
    subscribe = mocks.subscribe;
    dispatch = mocks.dispatch;
    cancel = mocks.cancel;
    demo = mocks.demo;
    refresh = mocks.refresh;
    setActive = mocks.setActive;
  }
  return {
    get API_BASE() {
      return mocks.apiBase;
    },
    DemoFleetService: class extends Service {
      constructor() {
        super();
        mocks.demoConstructor();
      }
    },
    ApiFleetService: class extends Service {
      constructor(base: string) {
        super();
        mocks.apiConstructor(base);
      }
    },
  };
});

type Listener = (snapshot: FleetSnapshot, issue?: string) => void;
let listener: Listener;
let appState: (state: string) => void;
const time = Date.parse("2026-11-17T12:00:00Z");
const mount = () => renderHook(useFleet, { wrapper: FleetProvider });
function publish(issue?: string) {
  const snapshot = createDemo(Date.now());
  act(() => listener(snapshot, issue));
  return snapshot;
}
function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(time);
  vi.resetAllMocks();
  mocks.recordActivity.mockResolvedValue(undefined);
  mocks.apiBase = "";
  mocks.subscribe.mockImplementation((callback: Listener) => {
    listener = callback;
    return mocks.unsubscribe;
  });
  mocks.addAppStateListener.mockImplementation(
    (event: string, callback: typeof appState) => {
      appState = callback;
      return { remove: mocks.removeAppStateListener };
    },
  );
  for (const command of [
    mocks.dispatch,
    mocks.cancel,
    mocks.demo,
    mocks.refresh,
  ]) {
    command.mockResolvedValue(undefined);
  }
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useFleet and FleetProvider", () => {
  it("requires a FleetProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(useFleet)).toThrow("FleetProvider is required.");
  });
  it("starts with a loading snapshot and selects the demo service by default", () => {
    const { result } = mount();
    expect(result.current).toMatchObject({
      snapshot: null,
      now: time,
      error: null,
      notice: null,
      pending: false,
      connectionError: false,
      isLive: false,
    });
    expect(mocks.demoConstructor).toHaveBeenCalledOnce();
    expect(mocks.apiConstructor).not.toHaveBeenCalled();
    expect(mocks.subscribe).toHaveBeenCalledOnce();
    expect(mocks.addAppStateListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
  it("selects the live service only when an API base is configured", () => {
    mocks.apiBase = "https://fleet.example";
    const { result } = mount();
    expect(result.current.isLive).toBe(true);
    expect(mocks.apiConstructor).toHaveBeenCalledWith(mocks.apiBase);
    expect(mocks.demoConstructor).not.toHaveBeenCalled();
  });
  it("publishes telemetry and updates the clock independently", () => {
    const { result } = mount();
    const snapshot = publish();
    expect(result.current.snapshot).toEqual(snapshot);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.now).toBe(time + 1000);
    vi.setSystemTime(time + 3500);
    publish();
    expect(result.current.now).toBe(time + 3500);
  });
  it("keeps a demo storage warning separate from live connection failure", () => {
    const { result } = mount();
    publish("Storage unavailable");
    expect(result.current.error).toBe("Storage unavailable");
    expect(result.current.connectionError).toBe(false);
    publish();
    expect(result.current.error).toBeNull();
  });
  it("reports and recovers live telemetry errors without using demo state", () => {
    mocks.apiBase = "https://fleet.example";
    const { result } = mount();
    publish("Robot endpoint unreachable");
    expect(result.current.connectionError).toBe(true);
    expect(result.current.error).toBe("Robot endpoint unreachable");
    publish();
    expect(result.current.connectionError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mocks.demoConstructor).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "dispatch",
      invoke: (fleet: FleetController) => fleet.dispatch("station_b"),
      mock: mocks.dispatch,
      args: ["station_b"],
      notice: "Mission accepted. Follow its progress on the map.",
    },
    {
      name: "cancel",
      invoke: (fleet: FleetController) => fleet.cancel("task_01"),
      mock: mocks.cancel,
      args: ["task_01"],
      notice: "Mission canceled. Simulated motion stopped.",
    },
    {
      name: "demo",
      invoke: (fleet: FleetController) => fleet.demo("manual-on"),
      mock: mocks.demo,
      args: ["manual-on"],
      notice: "Simulation updated.",
    },
    {
      name: "reset",
      invoke: (fleet: FleetController) => fleet.demo("reset"),
      mock: mocks.demo,
      args: ["reset"],
      notice: "Demo reset. Sample missions restored.",
    },
    {
      name: "refresh",
      invoke: (fleet: FleetController) => fleet.refresh(),
      mock: mocks.refresh,
      args: [],
      notice: "Telemetry refresh requested.",
    },
  ])(
    "forwards $name and exposes its success notice",
    async ({ invoke, mock, args, notice }) => {
      const { result } = mount();
      await act(async () => {
        expect(await invoke(result.current)).toBe(true);
      });
      expect(mock).toHaveBeenCalledWith(...args);
      expect(result.current.pending).toBe(false);
      expect(result.current.notice).toBe(notice);
      expect(result.current.error).toBeNull();
    },
  );
  it("does not report live cancellation as an already-stopped robot", async () => {
    mocks.apiBase = "https://fleet.example";
    const { result } = mount();
    await act(async () => {
      await result.current.cancel("task_01");
    });
    expect(result.current.notice).toBe(
      "Backend acknowledged cancellation. Check robot status before new work.",
    );
  });
  it("blocks concurrent commands immediately, before a pending rerender", async () => {
    const waiting = deferred();
    mocks.dispatch.mockReturnValueOnce(waiting.promise);
    const { result } = mount();
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.dispatch("station_b");
      second = result.current.cancel("task_01");
    });
    expect(result.current.pending).toBe(true);
    expect(await second).toBe(false);
    expect(mocks.cancel).not.toHaveBeenCalled();
    await act(async () => {
      waiting.resolve();
      expect(await first).toBe(true);
    });
    expect(result.current.pending).toBe(false);
    await act(async () => {
      expect(await result.current.cancel("task_01")).toBe(true);
    });
  });
  it.each([
    { failure: new Error("Dispatch rejected"), message: "Dispatch rejected" },
    {
      failure: "non-Error rejection",
      message: "Command failed. Check current status.",
    },
  ])(
    "returns false and releases pending state after $message",
    async ({ failure, message }) => {
      mocks.dispatch.mockRejectedValueOnce(failure);
      const { result } = mount();
      await act(async () => {
        expect(await result.current.dispatch("station_b")).toBe(false);
      });
      expect(result.current.error).toBe(message);
      expect(result.current.notice).toBeNull();
      expect(result.current.pending).toBe(false);
      // A healthy telemetry tick must not erase a command failure.
      publish();
      expect(result.current.error).toBe(message);
      await act(async () => {
        expect(await result.current.refresh()).toBe(true);
      });
      expect(result.current.error).toBeNull();
    },
  );
  it("prioritizes telemetry failures and dismisses error/notice presentation", async () => {
    mocks.dispatch.mockRejectedValueOnce(new Error("Command rejected"));
    const { result } = mount();
    await act(async () => {
      await result.current.dispatch("station_b");
    });
    publish("Telemetry rejected");
    expect(result.current.error).toBe("Telemetry rejected");
    publish();
    expect(result.current.error).toBe("Command rejected");
    await act(async () => {
      await result.current.refresh();
    });
    act(() => result.current.dismiss());
    expect(result.current.notice).toBeNull();
    publish("Telemetry rejected");
    act(() => result.current.dismiss());
    expect(result.current.error).toBeNull();
  });
  it.each(["background", "inactive"])(
    "clears demo manual mode on %s and refreshes on foreground",
    async (state) => {
      mount();
      await act(async () => {
        appState(state);
      });
      expect(mocks.demo).toHaveBeenCalledWith("manual-off");
      await act(async () => {
        appState("active");
      });
      expect(mocks.refresh).toHaveBeenCalledOnce();
    },
  );
  it.each(["background", "inactive"])(
    "never sends demo commands in live mode on %s",
    async (state) => {
      mocks.apiBase = "https://fleet.example";
      mount();
      await act(async () => {
        appState(state);
        appState("active");
      });
      expect(mocks.demo).not.toHaveBeenCalled();
      expect(mocks.refresh).toHaveBeenCalledOnce();
    },
  );
  it("shares one controller and service across multiple consumers", () => {
    const controllers: FleetController[] = [];
    function Consumer() {
      controllers.push(useFleet());
      return null;
    }
    render(
      createElement(
        FleetProvider,
        null,
        createElement(Consumer),
        createElement(Consumer),
      ),
    );
    expect(controllers[0]).toBe(controllers[1]);
    expect(mocks.demoConstructor).toHaveBeenCalledOnce();
    const snapshot = publish();
    expect(controllers.at(-1)?.snapshot).toEqual(snapshot);
    expect(controllers.at(-1)).toBe(controllers.at(-2));
  });
  it("removes subscriptions, AppState listener and clock on unmount", async () => {
    const { result, unmount } = mount();
    publish();
    const previous = result.current;
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    expect(mocks.removeAppStateListener).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    act(() => {
      listener(createDemo(), "Late telemetry");
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(previous);
    expect(await result.current.dispatch("station_b")).toBe(false);
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });
  it.each(["resolve", "reject"] as const)(
    "ignores late command %s presentation after unmount",
    async (settle) => {
      const waiting = deferred();
      mocks.dispatch.mockReturnValueOnce(waiting.promise);
      const { result, unmount } = mount();
      let command!: Promise<boolean>;
      act(() => {
        command = result.current.dispatch("station_b");
      });
      unmount();
      await act(async () => {
        if (settle === "resolve") waiting.resolve();
        else waiting.reject(new Error("Late failure"));
        expect(await command).toBe(settle === "resolve");
      });
      expect(result.current.error).toBeNull();
      expect(result.current.notice).toBeNull();
    },
  );
  it("records fixed action codes without destination, IDs or error payloads", async () => {
    const { result } = mount();
    await act(async () => {
      await result.current.dispatch("station_b");
    });
    expect(mocks.recordActivity).toHaveBeenCalledWith(
      "mission_dispatch",
      "ok",
      "demo",
    );
    expect(
      mocks.recordActivity.mock.calls.every((args) => args.length === 3),
    ).toBe(true);
  });
  it("pauses live polling and handles foreground refresh failures", async () => {
    mocks.apiBase = "https://fleet.example";
    const { result } = mount();
    await act(async () => {
      appState("background");
    });
    expect(mocks.setActive).toHaveBeenCalledWith(false);
    mocks.refresh.mockRejectedValueOnce(new Error("private backend detail"));
    await act(async () => {
      appState("active");
    });
    expect(mocks.setActive).toHaveBeenCalledWith(true);
    expect(result.current.error).toBe(
      "Workspace update failed. Refresh telemetry before continuing.",
    );
  });
  it("ignores telemetry from an expired Strict Mode subscription", () => {
    const { result } = renderHook(useFleet, {
      wrapper: FleetProvider,
      reactStrictMode: true,
    });
    expect(mocks.subscribe).toHaveBeenCalledTimes(2);
    const obsolete = mocks.subscribe.mock.calls[0][0] as Listener;
    act(() => obsolete(createDemo(), "Expired subscription"));
    expect(result.current.snapshot).toBeNull();
    publish();
    expect(result.current.snapshot).not.toBeNull();
  });
  it("switches to a validated backend and ignores expired demo callbacks", () => {
    const { result } = mount();
    publish();
    const obsolete = listener;
    act(() =>
      expect(result.current.connectBackend(" https://fleet.example/ ")).toBe(
        true,
      ),
    );
    expect(result.current.apiBase).toBe("https://fleet.example");
    expect(result.current.snapshot).toBeNull();
    expect(result.current.isLive).toBe(true);
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    expect(mocks.apiConstructor).toHaveBeenCalledWith("https://fleet.example");
    act(() => obsolete(createDemo(), "Expired demo"));
    expect(result.current.snapshot).toBeNull();
  });
  it("rejects unsafe connection URLs without selecting a live service", () => {
    const { result } = mount();
    act(() =>
      expect(
        result.current.connectBackend("https://user:secret@fleet.example"),
      ).toBe(false),
    );
    expect(result.current.isLive).toBe(false);
    expect(result.current.error).toContain("without credentials");
    expect(mocks.apiConstructor).not.toHaveBeenCalled();
  });
  it("prevents switching while a mission or command is active", async () => {
    const { result } = mount();
    const data = createDemo();
    data.robot.status = "busy";
    act(() => listener(data));
    act(() =>
      expect(result.current.connectBackend("https://fleet.example")).toBe(
        false,
      ),
    );
    publish();
    const waiting = deferred();
    mocks.dispatch.mockReturnValueOnce(waiting.promise);
    let command!: Promise<boolean>;
    act(() => {
      command = result.current.dispatch("station_b");
      expect(result.current.connectBackend("https://fleet.example")).toBe(
        false,
      );
    });
    await act(async () => {
      waiting.resolve();
      await command;
    });
    expect(mocks.apiConstructor).not.toHaveBeenCalled();
  });
  it("can explicitly return to demo without persisting or reporting the URL", () => {
    mocks.apiBase = "https://fleet.example";
    const { result } = mount();
    publish();
    act(() => expect(result.current.connectBackend("")).toBe(true));
    expect(result.current.isLive).toBe(false);
    expect(mocks.demoConstructor).toHaveBeenCalledOnce();
    expect(mocks.recordActivity.mock.calls.flat()).not.toContain(
      "https://fleet.example",
    );
  });
});
