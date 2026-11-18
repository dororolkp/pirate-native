// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import HeroScene from "../../src/components/hero-scene.web";

vi.mock("../../src/components/gazebo-scene", () => ({
  GazeboScene: () => createElement("span", null, "Vector art"),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("reads tab visibility and removes its exact subscription on unmount", () => {
  const add = vi.spyOn(document, "addEventListener");
  const remove = vi.spyOn(document, "removeEventListener");
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  const { unmount } = render(createElement(HeroScene));
  expect(screen.getByTestId("driving-art").dataset.paused).toBe("true");
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(screen.getByTestId("driving-art").dataset.paused).toBe("false");
  const callback = add.mock.calls.find(
    ([name]) => name === "visibilitychange",
  )?.[1];
  unmount();
  expect(remove).toHaveBeenCalledWith("visibilitychange", callback);
});
