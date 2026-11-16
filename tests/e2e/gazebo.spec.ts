import { expect, test } from "@playwright/test";

test("Gazebo lab stays idle and keyboard preview clears on release", async ({
  page,
}) => {
  const controlRequests: string[] = [];
  page.on("request", (request) => {
    if (
      /\/api\/v1\/(simulator|robots|tasks)|\/cmd_vel|\/control/.test(
        new URL(request.url()).pathname,
      )
    )
      controlRequests.push(request.url());
  });
  await page.goto("/robots");
  await expect(
    page.getByRole("heading", { name: "Gazebo driving lab", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Connect Gazebo (coming later)",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Enable driving keyboard", exact: true })
    .click();
  await page.keyboard.down("ArrowUp");
  await expect(
    page.getByText("Preview: forward / 1.00 m/s / 0.000 rad/s", {
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.up("ArrowUp");
  await expect(
    page.getByText("Preview: stop / 0.00 m/s / 0.000 rad/s", { exact: true }),
  ).toBeVisible();
  await page.keyboard.down("ArrowLeft");
  await expect(page.getByText(/Preview: left \/ 1.00 m\/s/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByText("Preview: stop / 0.00 m/s / 0.000 rad/s", { exact: true }),
  ).toBeVisible();
  await page.keyboard.up("ArrowLeft");
  await page
    .getByRole("button", { name: "What does the backend need?", exact: true })
    .click();
  await expect(
    page.getByText(/A control lease, validated telemetry/),
  ).toBeVisible();
  expect(controlRequests).toEqual([]);
});

test("static metadata and analytics default-off are present", async ({
  page,
  request,
}) => {
  const response = await request.get("/robots");
  const html = await response.text();
  expect(html).toContain("Gazebo Driving Lab | Pirate");
  expect(html).toContain('name="description"');
  expect(html).toContain('rel="canonical"');
  expect(html).toContain('lang="en"');
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  const analytics: string[] = [];
  page.on("request", (req) => {
    if (/google-analytics\.com|googletagmanager\.com/.test(req.url()))
      analytics.push(req.url());
  });
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Privacy & analytics", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Keep analytics off", exact: true })
    .click();
  expect(analytics).toEqual([]);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("pirate-analytics-consent-v1"),
    ),
  ).toBe("denied");
});
