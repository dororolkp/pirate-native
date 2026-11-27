// @vitest-environment jsdom
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { cleanup, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useClientReady } from "../../src/hooks/use-client-ready";

afterEach(cleanup);

function Probe() {
  const ready = useClientReady();
  return createElement(
    "button",
    { disabled: !ready },
    ready ? "Ready" : "Waiting",
  );
}

describe("client interaction readiness", () => {
  it("is ready on a client-only native or web mount", () => {
    expect(renderHook(useClientReady).result.current).toBe(true);
  });
  it("prerenders a disabled control until hydration", () => {
    expect(renderToString(createElement(Probe))).toContain('disabled=""');
    expect(renderToString(createElement(Probe))).toContain("Waiting");
  });
  it("enables a prerendered control after hydration", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(createElement(Probe));
    document.body.appendChild(container);
    render(createElement(Probe), { container, hydrate: true });
    expect(
      (screen.getByRole("button", { name: "Ready" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    container.remove();
  });
});
