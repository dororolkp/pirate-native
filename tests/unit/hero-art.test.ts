// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HeroArt } from "../../src/components/hero-art.web";
import { VisualBoundary } from "../../src/components/visual-boundary";

vi.mock("react-native", () => ({
  View: ({ children }: { children: React.ReactNode }) =>
    createElement("div", null, children),
  Text: ({ children }: { children: React.ReactNode }) =>
    createElement("span", null, children),
}));
vi.mock("../../src/components/hero-scene.web", () => ({
  default: () => createElement("span", null, "Scene ready"),
}));

let callbacks: IntersectionObserverCallback[];
let observers: {
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}[];

beforeEach(() => {
  callbacks = [];
  observers = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback);
        observers.push(this);
      }
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function intersect(index: number, visible: boolean) {
  act(() =>
    callbacks[index](
      [{ isIntersecting: visible } as IntersectionObserverEntry],
      observers[index] as unknown as IntersectionObserver,
    ),
  );
}

it("does not render art until its container is near the viewport", async () => {
  render(createElement(HeroArt));
  expect(screen.queryByText("Scene ready")).toBeNull();
  expect(screen.getByTestId("hero-art").dataset.visualReady).toBe("false");
  intersect(0, false);
  expect(screen.queryByText("Scene ready")).toBeNull();
  intersect(0, true);
  await screen.findByText("Scene ready");
  expect(observers[0].disconnect).toHaveBeenCalled();
  expect(screen.getByTestId("hero-art").dataset.visualReady).toBe("true");
});

it("falls back to eager art in browsers without IntersectionObserver", async () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  render(createElement(HeroArt));
  await screen.findByText("Scene ready");
});

it("server renders only stable fallback geometry", () => {
  const html = renderToString(createElement(HeroArt));
  expect(html).toContain("Driving-world illustration loads when visible.");
  expect(html).not.toContain("Scene ready");
  expect(observers).toHaveLength(0);
});

it("disconnects and ignores obsolete Strict Mode observer callbacks", async () => {
  const { unmount } = render(createElement(HeroArt), {
    wrapper: StrictMode,
    reactStrictMode: true,
  });
  expect(observers).toHaveLength(2);
  intersect(0, true);
  expect(screen.queryByText("Scene ready")).toBeNull();
  intersect(1, true);
  await screen.findByText("Scene ready");
  unmount();
  for (const observer of observers)
    expect(observer.disconnect).toHaveBeenCalled();
});

it("isolates failed illustration rendering from workspace controls", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  function BrokenArt(): never {
    throw new Error("Chunk failed");
  }
  render(
    createElement(
      "div",
      null,
      createElement("button", null, "Mission controls"),
      createElement(VisualBoundary, null, createElement(BrokenArt)),
    ),
  );
  expect(screen.getByText(/Illustration unavailable/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Mission controls" })).toBeTruthy();
});
