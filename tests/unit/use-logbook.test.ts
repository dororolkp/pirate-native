// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActivitySnapshot } from "../../src/lib/activity-store";
import { useLogbook } from "../../src/hooks/use-logbook";

const state = vi.hoisted(() => ({
  snapshot: {
    entries: [],
    enabled: true,
    ready: false,
    error: null,
  } as ActivitySnapshot,
  listeners: new Set<() => void>(),
  initialize: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../src/lib/activity-store", () => ({
  EMPTY_ACTIVITY: { entries: [], enabled: true, ready: false, error: null },
  activityStore: {
    initialize: state.initialize,
    getSnapshot: () => state.snapshot,
    subscribe: (listener: () => void) => {
      state.listeners.add(listener);
      return () => {
        state.listeners.delete(listener);
      };
    },
  },
}));
beforeEach(() => {
  state.snapshot = { entries: [], enabled: true, ready: false, error: null };
  state.initialize.mockClear();
});
afterEach(() => cleanup());
describe("useLogbook", () => {
  it("starts hydration and exposes loading status", () => {
    const { result } = renderHook(useLogbook);
    expect(state.initialize).toHaveBeenCalledOnce();
    expect(result.current.ready).toBe(false);
  });
  it("renders store updates without polling and unsubscribes on unmount", () => {
    const { result, unmount } = renderHook(useLogbook);
    act(() => {
      state.snapshot = {
        entries: [],
        enabled: false,
        ready: true,
        error: "Storage unavailable",
      };
      state.listeners.forEach((listener) => listener());
    });
    expect(result.current).toMatchObject({
      enabled: false,
      ready: true,
      error: "Storage unavailable",
    });
    unmount();
    expect(state.listeners.size).toBe(0);
  });
  it("server-renders an empty logbook without accessing device history", () => {
    state.snapshot = {
      entries: [],
      enabled: false,
      ready: true,
      error: "Private local state",
    };
    function Probe() {
      const journal = useLogbook();
      return createElement("span", null, journal.ready ? "private" : "loading");
    }
    expect(renderToString(createElement(Probe))).toBe("<span>loading</span>");
    expect(state.initialize).not.toHaveBeenCalled();
  });
});
