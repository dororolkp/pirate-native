import { expect, test } from "@playwright/test";
import { backendRobot, backendTask } from "../unit/backend-fixtures";
import { GUIDE_STEPS } from "../../src/lib/guide-steps";

test("guided workflow highlights targets across routes without issuing commands", async ({
  page,
}) => {
  const commands: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") commands.push(request.url());
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start guided tour", exact: true })
    .click();
  const guide = page.getByTestId("guided-tour");
  for (let index = 0; index < GUIDE_STEPS.length; index++) {
    const step = GUIDE_STEPS[index];
    await expect(
      guide.getByRole("heading", { name: step.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('[data-guide-highlight="true"]').first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await guide
      .getByRole("button", {
        name: index === GUIDE_STEPS.length - 1 ? "Finish guide" : "Next step",
        exact: true,
      })
      .click();
  }
  await expect(guide).toHaveCount(0);
  await expect(page.locator('[data-guide-highlight="true"]')).toHaveCount(0);
  expect(commands).toEqual([]);
});

test("David's payloads drive the live map, history and acknowledged cancellation", async ({
  page,
}) => {
  const robot = backendRobot();
  let task = backendTask({ state: "queued", progress: 0, started_at: null });
  let accepted = false;
  const posts: string[] = [];
  await page.route("https://backend.example/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let body: unknown;
    if (request.method() === "POST") {
      posts.push(url.pathname);
      if (url.pathname.endsWith("/cancel")) {
        task = {
          ...task,
          state: "canceled",
          finished_at: new Date().toISOString(),
        };
        robot.state = "idle";
        robot.current_task_id = null;
        body = task;
      } else {
        expect(request.postDataJSON()).toEqual({
          robot_id: "robot_01",
          destination: "station_b",
        });
        accepted = true;
        robot.state = "busy";
        robot.current_task_id = task.task_id;
        body = { task_id: task.task_id, state: "queued" };
      }
    } else if (url.pathname.endsWith("/robots")) {
      body = { ...robot, updated_at: new Date().toISOString() };
      body = [body];
    } else body = url.search ? (accepted ? [task] : []) : task;
    await route.fulfill({ json: body });
  });
  await page.goto("/settings");
  await page
    .getByRole("textbox", { name: "Backend server URL" })
    .fill("https://backend.example");
  await page
    .getByRole("button", { name: "Connect backend", exact: true })
    .click();
  await expect(
    page.getByText("Mode: Live API / Robot: robot_01", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("img", { name: /robot_01 at x -4.00, y 0.00 metres/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Battery not reported", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Send to Station B", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send to Station A", exact: true }),
  ).toBeDisabled();
  task = {
    ...task,
    state: "running",
    progress: 0.4,
    started_at: new Date().toISOString(),
  };
  robot.pose = { x: -8, y: 2.4, theta: 1 };
  await expect(
    page.getByRole("img", { name: /robot_01 at x -8.00, y 2.40 metres/ }),
  ).toBeVisible();
  await expect(page.getByText("40%", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel mission", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send to Station A", exact: true }),
  ).toBeEnabled();
  await page.getByRole("link", { name: "Missions", exact: true }).click();
  await page.getByRole("button", { name: "canceled", exact: true }).click();
  await expect(
    page.getByText(task.task_id, { exact: true }).first(),
  ).toBeVisible();
  expect(posts).toEqual([
    "/api/v1/tasks",
    `/api/v1/tasks/${task.task_id}/cancel`,
  ]);
});

test("backend failure is visible and never unlocks demo controls", async ({
  page,
}) => {
  await page.route("https://backend.example/api/v1/**", (route) =>
    route.fulfill({ status: 503, json: { detail: "Backend unavailable" } }),
  );
  await page.goto("/settings");
  await page
    .getByRole("textbox", { name: "Backend server URL" })
    .fill("https://backend.example");
  await page
    .getByRole("button", { name: "Connect backend", exact: true })
    .click();
  await expect(
    page.getByText("Backend unavailable", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Send to Station B", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("img", { name: /Robot pose unavailable/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Battery not reported", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Stop simulation", exact: true }),
  ).toHaveCount(0);
});

test("320px guide can exit and return to the workspace", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start guided tour", exact: true })
    .click();
  await expect(page.getByTestId("guided-tour")).toBeVisible();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(
    page.locator('[data-guide="button-connect-backend"]'),
  ).toHaveAttribute("data-guide-highlight", "true");
  await page.getByRole("button", { name: "Exit guide", exact: true }).click();
  await expect(page.getByTestId("guided-tour")).toHaveCount(0);
  await expect(page.locator('[data-guide-highlight="true"]')).toHaveCount(0);
});
