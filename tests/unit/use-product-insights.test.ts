// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { useProductInsights } from "../../src/hooks/use-product-insights";
import { insightsStore } from "../../src/lib/product-insights";
afterEach(() => {
  cleanup();
  insightsStore.setEnabled(false);
});

describe("local insights hook", () => {
  it("shares updates and clears on withdrawal", () => {
    const first = renderHook(useProductInsights);
    const second = renderHook(useProductInsights);
    act(() => first.result.current.setEnabled(true));
    act(() => insightsStore.record("help_opened"));
    expect(second.result.current.total).toBe(1);
    act(() => second.result.current.setEnabled(false));
    expect(first.result.current.total).toBe(0);
  });
  it("uses a private empty server snapshot", () => {
    insightsStore.setEnabled(true);
    insightsStore.record("help_opened");
    function Probe() {
      return createElement("span", null, useProductInsights().total);
    }
    expect(renderToString(createElement(Probe))).toContain(">0<");
  });
  it("unsubscribes when unmounted", () => {
    const subscribe = vi.spyOn(insightsStore, "subscribe");
    const hook = renderHook(useProductInsights);
    expect(subscribe).toHaveBeenCalledOnce();
    hook.unmount();
    insightsStore.setEnabled(true);
    expect(hook.result.current.enabled).toBe(false);
  });
});
