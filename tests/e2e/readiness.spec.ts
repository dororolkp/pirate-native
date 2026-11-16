import { expect, test } from "@playwright/test";

test("logbook filters, exports, persists and can be cleared or disabled", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Send to Station B", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancel mission", exact: true })
    .click();
  await page.getByRole("link", { name: "Logbook", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Operational logbook", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search logbook" })
    .fill("cancellation");
  await expect(
    page.getByText("Mission cancellation request", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("textbox", { name: "Search logbook" })
    .fill("cancellation");
  await expect(
    page.getByText("Mission cancellation request", { exact: true }),
  ).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export logbook CSV" }).click();
  expect((await downloaded).suggestedFilename()).toMatch(
    /pirate-logbook.*\.csv/,
  );
  await page
    .getByRole("button", { name: "Clear local logbook", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Clear local logbook?", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirm clear logbook", exact: true })
    .click();
  await expect(
    page.getByText("No matching events", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Disable local recording", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Enable local recording", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No matching events", { exact: true }),
  ).toBeVisible();
});

test("keyboard skip link reaches main content and all six navigation targets are touch-sized", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", {
    name: "Skip to workspace",
    exact: true,
  });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  for (const label of [
    "Overview",
    "Robots",
    "Missions",
    "Analytics",
    "Logbook",
    "Settings",
  ]) {
    const bounds = await page
      .getByRole("link", { name: label, exact: true })
      .boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("private logbook HTML is no-index and public HTML includes honest structured data", async ({
  request,
}) => {
  const privatePage = await request.get("/logbook");
  expect(privatePage.status()).toBe(200);
  const html = await privatePage.text();
  expect(html).toContain("noindex");
  expect(html).not.toContain("demo_024");
  const publicHtml = await (await request.get("/")).text();
  expect(publicHtml).toContain("application/ld+json");
  expect(publicHtml).toContain("SoftwareApplication");
  expect(publicHtml).toContain("Backend robot control is not enabled");
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain(
    "/logbook",
  );
});
