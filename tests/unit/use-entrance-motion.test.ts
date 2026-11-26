// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEntranceMotion } from "../../src/hooks/use-entrance-motion";
const mocks = vi.hoisted(() => ({
  preference: vi.fn(),
  prefRemove: vi.fn(),
  stateRemove: vi.fn(),
  timing: vi.fn(),
  setValue: vi.fn(),
  stop: vi.fn(),
  start: vi.fn(),
  platform: { OS: "ios" },
  state: { currentState: "active" },
  changed: (_value: boolean) => {},
  background: (_value: string) => {},
}));
vi.mock("react-native", () => ({
  Platform: mocks.platform,
  Animated: {
    Value: class {
      setValue = mocks.setValue;
    },
    timing: mocks.timing,
  },
  AccessibilityInfo: {
    isReduceMotionEnabled: mocks.preference,
    addEventListener: (_event: string, callback: (value: boolean) => void) => {
      mocks.changed = callback;
      return { remove: mocks.prefRemove };
    },
  },
  AppState: {
    get currentState() {
      return mocks.state.currentState;
    },
    addEventListener: (_event: string, callback: (value: string) => void) => {
      mocks.background = callback;
      return { remove: mocks.stateRemove };
    },
  },
}));
const value = { setValue: mocks.setValue };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.platform.OS = "ios";
  mocks.state.currentState = "active";
  mocks.preference.mockResolvedValue(false);
  mocks.timing.mockReturnValue({ start: mocks.start, stop: mocks.stop });
});
afterEach(cleanup);
describe("finite accessibility-aware entrance motion", () => {
  it("uses a short non-interactive native animation and cleans up", async () => {
    const hook = renderHook(useEntranceMotion);
    await act(async () => {});
    expect(mocks.timing).toHaveBeenCalledWith(value, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
      isInteraction: false,
    });
    hook.unmount();
    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.prefRemove).toHaveBeenCalledOnce();
    expect(mocks.stateRemove).toHaveBeenCalledOnce();
  });
  it("does not animate reduced-motion users or a failed preference read", async () => {
    mocks.preference.mockResolvedValueOnce(true);
    const hook = renderHook(useEntranceMotion);
    await act(async () => {});
    expect(mocks.timing).not.toHaveBeenCalled();
    hook.unmount();
    mocks.preference.mockRejectedValueOnce(new Error("Unavailable"));
    renderHook(useEntranceMotion);
    await act(async () => {});
    expect(mocks.timing).not.toHaveBeenCalled();
    expect(mocks.setValue).toHaveBeenCalledWith(1);
  });
  it("does not let a late initial query override a changed preference", async () => {
    let resolve!: (value: boolean) => void;
    mocks.preference.mockReturnValueOnce(
      new Promise<boolean>((done) => {
        resolve = done;
      }),
    );
    renderHook(useEntranceMotion);
    act(() => mocks.changed(true));
    await act(async () => resolve(false));
    expect(mocks.timing).not.toHaveBeenCalled();
  });
  it("settles on background and uses the JS driver on web", async () => {
    mocks.platform.OS = "web";
    renderHook(useEntranceMotion);
    await act(async () => {});
    expect(mocks.timing.mock.calls[0][1].useNativeDriver).toBe(false);
    act(() => mocks.background("background"));
    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.setValue).toHaveBeenLastCalledWith(1);
  });
  it("ignores preference results after unmount", async () => {
    let resolve!: (value: boolean) => void;
    mocks.preference.mockReturnValueOnce(
      new Promise<boolean>((done) => {
        resolve = done;
      }),
    );
    const hook = renderHook(useEntranceMotion);
    hook.unmount();
    await act(async () => resolve(false));
    expect(mocks.timing).not.toHaveBeenCalled();
  });
});
