// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GuidedTourProvider,
  useGuidedTour,
} from "../../src/hooks/use-guided-tour";
import { GUIDE_STEPS } from "../../src/lib/guide-steps";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("expo-router", () => ({ router: { push: mocks.push } }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("guided workflow", () => {
  it("does not auto-start or navigate on workspace load", () => {
    const { result } = renderHook(useGuidedTour, {
      wrapper: GuidedTourProvider,
    });
    expect(result.current?.step).toBeNull();
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it("starts with connection setup and navigates to each step's route", () => {
    const { result } = renderHook(useGuidedTour, {
      wrapper: GuidedTourProvider,
    });
    act(() => result.current?.start());
    expect(result.current?.step?.target).toBe("connection");
    expect(mocks.push).toHaveBeenLastCalledWith("/settings");
    act(() => result.current?.next());
    expect(result.current?.step?.title).toBe("Connect backend");
    act(() => result.current?.previous());
    expect(result.current?.index).toBe(0);
  });
  it("bounds steps, exits cleanly, and can restart", () => {
    const { result } = renderHook(useGuidedTour, {
      wrapper: GuidedTourProvider,
    });
    act(() => result.current?.start());
    act(() => result.current?.previous());
    expect(result.current?.index).toBe(0);
    for (let i = 0; i < GUIDE_STEPS.length + 1; i++)
      act(() => result.current?.next());
    expect(result.current?.index).toBe(GUIDE_STEPS.length - 1);
    act(() => result.current?.stop());
    expect(result.current?.step).toBeNull();
    act(() => result.current?.start());
    expect(result.current?.index).toBe(0);
  });
  it("works outside a tour provider without starting anything", () => {
    const { result } = renderHook(useGuidedTour);
    expect(result.current).toBeNull();
  });
});
