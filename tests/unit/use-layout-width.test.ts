// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { createElement, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLayoutWidth } from "../../src/hooks/use-layout-width";

const native = vi.hoisted(() => ({
  os: "web",
  dimensions: { width: 390, height: 844, scale: 1, fontScale: 1 },
  useWindowDimensions: vi.fn(),
}));
vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return native.os;
    },
  },
  useWindowDimensions: native.useWindowDimensions,
}));

function resize(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  act(() => window.dispatchEvent(new Event("resize")));
}
beforeEach(() => {
  native.os = "web";
  native.dimensions = { width: 390, height: 844, scale: 1, fontScale: 1 };
  native.useWindowDimensions.mockImplementation(() => native.dimensions);
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1200,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useLayoutWidth", () => {
  it("reads browser width rather than native dimensions on web", () => {
    const { result } = renderHook(useLayoutWidth);
    expect(result.current).toBe(1200);
    expect(native.useWindowDimensions).toHaveBeenCalled();
  });
  it("responds to resize across mobile and desktop layout breakpoints", () => {
    const { result } = renderHook(useLayoutWidth);
    for (const width of [375, 600, 850, 1050, 1440, 0]) {
      resize(width);
      expect(result.current).toBe(width);
    }
  });
  it.each(["ios", "android"])(
    "uses React Native dimensions and no browser resize subscription on %s",
    (os) => {
      native.os = os;
      const add = vi.spyOn(window, "addEventListener");
      const { result, rerender } = renderHook(useLayoutWidth);
      expect(result.current).toBe(390);
      expect(
        add.mock.calls.filter(([event]) => event === "resize"),
      ).toHaveLength(0);
      native.dimensions = { ...native.dimensions, width: 844, height: 390 };
      rerender();
      expect(result.current).toBe(844);
    },
  );
  it("returns a stable zero-width layout during server rendering", () => {
    function Probe() {
      return createElement("span", null, useLayoutWidth());
    }
    const add = vi.spyOn(window, "addEventListener");
    expect(renderToString(createElement(Probe))).toBe("<span>0</span>");
    expect(add.mock.calls.filter(([event]) => event === "resize")).toHaveLength(
      0,
    );
  });
  it("hydrates the server layout before adopting the real browser width", async () => {
    const widths: number[] = [];
    function Probe() {
      const width = useLayoutWidth();
      widths.push(width);
      return createElement("span", null, width);
    }
    const container = document.createElement("div");
    container.innerHTML = renderToString(createElement(Probe));
    widths.length = 0;
    document.body.appendChild(container);
    const recoverableError = vi.fn();
    let root!: ReturnType<typeof hydrateRoot>;
    try {
      await act(async () => {
        root = hydrateRoot(container, createElement(Probe), {
          onRecoverableError: recoverableError,
        });
      });
      expect(widths[0]).toBe(0);
      expect(widths.at(-1)).toBe(1200);
      expect(container.textContent).toBe("1200");
      expect(recoverableError).not.toHaveBeenCalled();
    } finally {
      if (root) act(() => root.unmount());
      container.remove();
    }
  });
  it("removes the exact resize callback on unmount", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { result, unmount } = renderHook(useLayoutWidth);
    const callback = add.mock.calls.find(([event]) => event === "resize")?.[1];
    expect(callback).toEqual(expect.any(Function));
    unmount();
    expect(remove).toHaveBeenCalledWith("resize", callback);
    resize(600);
    expect(result.current).toBe(1200);
  });
  it("keeps other consumers subscribed when one unmounts", () => {
    const first = renderHook(useLayoutWidth);
    const second = renderHook(useLayoutWidth);
    first.unmount();
    resize(720);
    expect(first.result.current).toBe(1200);
    expect(second.result.current).toBe(720);
  });
  it("balances resize subscriptions during Strict Mode effect replay", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { result, unmount } = renderHook(useLayoutWidth, {
      wrapper: StrictMode,
    });
    resize(500);
    expect(result.current).toBe(500);
    unmount();
    const added = add.mock.calls.filter(([event]) => event === "resize");
    const removed = remove.mock.calls.filter(([event]) => event === "resize");
    expect(added.length).toBeGreaterThan(0);
    expect(removed).toHaveLength(added.length);
    for (const [, callback] of added)
      expect(remove).toHaveBeenCalledWith("resize", callback);
  });
});
