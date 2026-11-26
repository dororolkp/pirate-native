// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceTools } from "../../src/hooks/use-workspace-tools";
const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("expo-router", () => ({ router: { push: mocks.push } }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("safe workspace command controller", () => {
  it("opens with an empty search and routes only a selected result", () => {
    const tour = vi.fn();
    const { result } = renderHook(() => useWorkspaceTools(tour));
    act(() => result.current.toggle());
    act(() => result.current.search("backend"));
    expect(result.current.results[0].route).toBe("/settings");
    act(() => result.current.choose());
    expect(mocks.push).toHaveBeenCalledWith("/settings");
    expect(result.current.open).toBe(false);
    expect(tour).not.toHaveBeenCalled();
  });
  it("bounds keyboard selection and ignores empty results", () => {
    const { result } = renderHook(() => useWorkspaceTools(vi.fn()));
    act(() => {
      result.current.search("no such tool");
      result.current.move(-10);
    });
    act(() => result.current.choose());
    expect(mocks.push).not.toHaveBeenCalled();
    act(() => result.current.search(""));
    act(() => result.current.move(999));
    expect(result.current.selection).toBe(result.current.results.length - 1);
  });
  it("starts help without dispatch and resets when reopened", () => {
    const tour = vi.fn();
    const { result } = renderHook(() => useWorkspaceTools(tour));
    act(() => result.current.search("onboarding"));
    act(() => result.current.choose());
    expect(tour).toHaveBeenCalledOnce();
    expect(mocks.push).not.toHaveBeenCalled();
    act(() => result.current.toggle());
    expect(result.current.query).toBe("");
  });
});
