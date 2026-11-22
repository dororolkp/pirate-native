import { expect, test } from "@playwright/test";

test("maximalist layout keeps controls and dialogs usable at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.getByTestId("maximalist-hero")).toBeVisible();
  await expect(page.getByText("SMALL ROBOT. BIG IDEAS.")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Close dialog", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Send to Station B", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel mission", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Cancel mission", exact: true })
    .click();
  for (const path of [
    "/robots",
    "/missions",
    "/analytics",
    "/logbook",
    "/settings",
  ]) {
    await page.goto(path);
    await expect(page.locator("#main-content")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("illustration chunk is deferred until visibility and does not shift its frame", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const callbacks: IntersectionObserverCallback[] = [];
    Object.assign(window, {
      __revealArt: () =>
        callbacks.forEach((callback) =>
          callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver,
          ),
        ),
      IntersectionObserver: class {
        constructor(callback: IntersectionObserverCallback) {
          callbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    });
  });
  const artRequests: string[] = [];
  page.on("request", (request) => {
    if (/hero-scene[^/]*\.js/.test(request.url()))
      artRequests.push(request.url());
  });
  await page.goto("/");
  const frame = page.getByTestId("hero-art");
  await expect(frame).toHaveAttribute("data-visual-ready", "false");
  await expect(page.getByText(/illustration loads when visible/)).toBeVisible();
  const before = await frame.boundingBox();
  expect(artRequests).toHaveLength(0);
  await page.evaluate(() =>
    (window as unknown as { __revealArt: () => void }).__revealArt(),
  );
  await expect(page.getByTestId("driving-art")).toBeVisible();
  expect(artRequests).toHaveLength(1);
  const after = await frame.boundingBox();
  expect(after?.height).toBeCloseTo(before!.height, 0);
  expect(after?.width).toBeCloseTo(before!.width, 0);
  await expect(
    page.getByRole("img", { name: /^Concept diagram: blue hatchback/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("failed decorative chunk leaves usable mission controls", async ({
  page,
}) => {
  await page.route(/hero-scene[^/]*\.js/, (route) => route.abort());
  await page.goto("/");
  await page.getByTestId("hero-art").scrollIntoViewIfNeeded();
  await expect(page.getByText(/Illustration unavailable/)).toBeVisible();
  await page
    .getByRole("button", { name: "Send to Station B", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel mission", exact: true }),
  ).toBeEnabled();
});

test("reduced motion suppresses art and sheen animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const art = page.getByTestId("driving-art");
  await page.getByTestId("hero-art").scrollIntoViewIfNeeded();
  await expect(art).toBeVisible();
  expect(
    await art.evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");
  expect(
    await page
      .getByRole("button", { name: "New mission", exact: true })
      .evaluate((node) => getComputedStyle(node, "::after").display),
  ).toBe("none");
});

test("decorative motion is finite and pauses in a hidden tab", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("hero-art").scrollIntoViewIfNeeded();
  const art = page.getByTestId("driving-art");
  await expect(art).toBeVisible();
  expect(
    await art.evaluate(
      (node) => getComputedStyle(node).animationIterationCount,
    ),
  ).toBe("1");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(art).toHaveAttribute("data-paused", "true");
  expect(
    await art.evaluate((node) => getComputedStyle(node).animationPlayState),
  ).toBe("paused");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(art).toHaveAttribute("data-paused", "false");
});
