import { expect, test } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /^Fleet overview/ }),
  ).toBeVisible();
});
test("renders the shared dashboard without page errors or horizontal overflow", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.reload();
  await expect(
    page.getByRole("img", { name: /Warehouse map. Atlas/ }),
  ).toBeVisible();
  await expect(page.getByText(/24 seeded sample missions/)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  for (const label of [
    "Overview",
    "Robots",
    "Missions",
    "Analytics",
    "Settings",
  ]) {
    const box = await page
      .getByRole("link", { name: label, exact: true })
      .boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({
    path: join(tmpdir(), `pirate-native-${info.project.name}.png`),
  });
  expect(errors).toEqual([]);
});
test("dispatches to Station B and completes with the correct pose", async ({
  page,
}) => {
  await page.clock.install();
  await page
    .getByRole("button", { name: "Send to Station B", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel mission", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send to Station A", exact: true }),
  ).toBeDisabled();
  await page.clock.fastForward(20_000);
  await expect(
    page.getByRole("img", { name: /Atlas at x 660, y 220. No active mission/ }),
  ).toBeAttached();
  await expect(
    page.getByRole("button", { name: "Send to Station A", exact: true }),
  ).toBeEnabled();
});
test("cancels a mission and preserves canceled history after reload", async ({
  page,
}) => {
  await page.getByRole("button", { name: "New mission", exact: true }).click();
  await page
    .getByRole("button", { name: "Dispatch mission", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancel mission", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send to Station B", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await page.getByRole("link", { name: "Missions", exact: true }).click();
  await page.getByRole("button", { name: "canceled", exact: true }).click();
  await expect(
    page.getByText("2 missions / Page 1 of 1", { exact: true }),
  ).toBeVisible();
});
test("supports manual demo steps, locks autonomous work, and clears mode on reload", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Robots", exact: true }).click();
  await page
    .getByRole("button", { name: "Enable manual control", exact: true })
    .click();
  await page.getByRole("button", { name: "Right", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /Atlas at x 152/ }),
  ).toBeAttached();
  await expect(
    page.getByRole("button", { name: "Send to Station B", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Enable manual control", exact: true }),
  ).toBeAttached();
  await expect(
    page.getByRole("button", { name: "Send to Station B", exact: true }),
  ).toBeEnabled();
});
test("filters and searches missions, opens details, and exports CSV", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Missions", exact: true }).click();
  await page.getByRole("button", { name: "failed", exact: true }).click();
  await expect(
    page.getByText("1 missions / Page 1 of 1", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Details", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Mission details", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo navigation timeout", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "All statuses", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search missions", exact: true })
    .fill("demo_024");
  await expect(
    page.getByText("1 missions / Page 1 of 1", { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(
    /pirate-missions.*\.csv/,
  );
  await page
    .getByRole("textbox", { name: "Search missions", exact: true })
    .fill("not-found");
  await expect(
    page.getByText("No missions found", { exact: true }),
  ).toBeVisible();
});
test("reports disconnect and reconnect without resuming failed work", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Send to Station B", exact: true })
    .click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Simulate disconnect", exact: true })
    .click();
  await page.getByRole("link", { name: "Robots", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Send to Station B", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Reconnect robot", exact: true })
    .click();
  await page.getByRole("link", { name: "Missions", exact: true }).click();
  await page.getByRole("button", { name: "failed", exact: true }).click();
  await expect(
    page.getByText("2 missions / Page 1 of 1", { exact: true }),
  ).toBeVisible();
});
test("runs obstacle recovery and timeout scenarios", async ({ page }) => {
  await page.clock.install();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Obstacle pause and recovery", exact: true })
    .click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "Send to Station B", exact: true })
    .click();
  await page.clock.fastForward(7000);
  const pausedPose = await page
    .getByRole("img", { name: /Warehouse map. Atlas/ })
    .getAttribute("aria-label");
  await page.clock.fastForward(2000);
  expect(
    await page
      .getByRole("img", { name: /Warehouse map. Atlas/ })
      .getAttribute("aria-label"),
  ).toBe(pausedPose);
  await page.clock.fastForward(15_000);
  await expect(
    page.getByRole("button", { name: "Send to Station A", exact: true }),
  ).toBeEnabled();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Navigation timeout", exact: true })
    .click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "Send to Station A", exact: true })
    .click();
  await page.clock.fastForward(16_000);
  await expect(
    page.getByText(
      "Navigation timed out after 15 seconds. Simulated motion stopped.",
      { exact: true },
    ),
  ).toBeAttached();
});
test("changes chart style, reporting ranges, map labels and zoom", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zoom out", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Center", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zoom out", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Labels", exact: true }).click();
  await expect(page.getByText("STORAGE ZONE", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await page.getByRole("button", { name: "Line chart", exact: true }).click();
  await expect(page.getByRole("img", { name: /line chart/ })).toBeAttached();
  await page.getByRole("button", { name: "24 hours", exact: true }).click();
  await expect(page.getByRole("img", { name: /last 24 hours/ })).toBeAttached();
  await page.getByRole("button", { name: "Today", exact: true }).click();
});
test("requires confirmation before reset and provides help and notifications", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome to Pirate", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Fleet notifications", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Reset demo data?", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep my data", exact: true }).click();
  await page
    .getByRole("button", { name: "Reset demo data", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm reset", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Reset demo data?", exact: true }),
  ).not.toBeVisible();
});
