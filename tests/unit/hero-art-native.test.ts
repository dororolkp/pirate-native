// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { HeroArt } from "../../src/components/hero-art";

const native = vi.hoisted(() => ({
  layout: undefined as undefined | (() => void),
}));
vi.mock("react-native", () => ({
  View: ({
    children,
    onLayout,
  }: {
    children: React.ReactNode;
    onLayout?: () => void;
  }) => {
    if (onLayout) native.layout = onLayout;
    return createElement("div", null, children);
  },
  Text: ({ children }: { children: React.ReactNode }) =>
    createElement("span", null, children),
}));
vi.mock("../../src/components/gazebo-scene", () => ({
  GazeboScene: () => createElement("span", null, "Native vector ready"),
}));
afterEach(cleanup);

it("defers native artwork rendering until container layout", async () => {
  render(createElement(HeroArt));
  expect(screen.queryByText("Native vector ready")).toBeNull();
  expect(native.layout).toEqual(expect.any(Function));
  act(() => native.layout?.());
  await screen.findByText("Native vector ready");
});
