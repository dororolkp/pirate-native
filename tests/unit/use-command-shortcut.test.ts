// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCommandShortcut } from "../../src/hooks/use-command-shortcut.web";
afterEach(cleanup);
describe("web command shortcuts", () => {
  it("handles Ctrl/Cmd+K and Escape without leaking listeners", () => {
    const toggle = vi.fn();
    const close = vi.fn();
    const hook = renderHook(() => useCommandShortcut(true, toggle, close));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "K", metaKey: true }),
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(toggle).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledOnce();
    hook.unmount();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
    );
    expect(toggle).toHaveBeenCalledTimes(2);
  });
  it("leaves editing, composition and unrelated keyboard input alone", () => {
    const toggle = vi.fn();
    renderHook(() => useCommandShortcut(false, toggle, vi.fn()));
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        isComposing: true,
      }),
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, altKey: true }),
    );
    expect(toggle).not.toHaveBeenCalled();
    input.remove();
  });
  it("handles Escape before a modal stops event propagation", () => {
    const close = vi.fn();
    renderHook(() => useCommandShortcut(true, vi.fn(), close));
    const input = document.createElement("input");
    input.addEventListener("keydown", (event) => event.stopPropagation());
    document.body.appendChild(input);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(close).toHaveBeenCalledOnce();
    input.remove();
  });
});
