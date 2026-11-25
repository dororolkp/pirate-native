import { expect, test } from "@playwright/test";

const base = process.env.LIVE_BACKEND_TEST_URL;
test("real FastAPI mock adapter completes Station B and Station A navigation", async ({
  page,
}) => {
  test.skip(
    !base,
    "Set LIVE_BACKEND_TEST_URL only for an isolated mock backend, never a physical robot.",
  );
  const response = await page.request.get(`${base}/api/v1/robots`);
  expect(response.ok()).toBe(true);
  const robots = await response.json();
  expect(robots[0].connected).toBe(true);
  const initial = await (
    await page.request.get(`${base}/api/v1/tasks?robot_id=robot_01&limit=200`)
  ).json();
  const previousIds = new Set(
    initial.map((item: { task_id: string }) => item.task_id),
  );
  await page.goto("/settings");
  await page.getByRole("textbox", { name: "Backend server URL" }).fill(base!);
  await page
    .getByRole("button", { name: "Connect backend", exact: true })
    .click();
  await expect(
    page.getByText("Mode: Live API / Robot: robot_01", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "Send to Station B", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel mission", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: /robot_01 at x -14.00, y 6.00 metres. No active mission/,
    }),
  ).toBeVisible({ timeout: 20_000 });
  await page
    .getByRole("button", { name: "Send to Station A", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel mission", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: /robot_01 at x -4.00, y 0.00 metres. No active mission/,
    }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Latest task: completed/)).toBeVisible();
  await page.getByRole("link", { name: "Missions", exact: true }).click();
  await page.getByRole("button", { name: "completed", exact: true }).click();
  const history = await (
    await page.request.get(`${base}/api/v1/tasks?robot_id=robot_01&limit=200`)
  ).json();
  const created = history.filter(
    (item: { task_id: string }) => !previousIds.has(item.task_id),
  );
  expect(created).toHaveLength(2);
  expect(created.map((item: { state: string }) => item.state)).toEqual([
    "completed",
    "completed",
  ]);
  for (const item of created)
    await expect(
      page.getByText(item.task_id, { exact: true }).first(),
    ).toBeVisible();
});
