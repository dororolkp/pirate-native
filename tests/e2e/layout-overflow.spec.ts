import { expect, test, type Locator } from "@playwright/test";

const viewports = [
  { width: 320, height: 480 },
  { width: 740, height: 320 },
  { width: 1440, height: 600 },
];

async function inside(child: Locator, parent: Locator) {
  await expect
    .poll(async () => {
      const a = await child.boundingBox();
      const b = await parent.boundingBox();
      return Boolean(
        a && b && a.y >= b.y - 1 && a.y + a.height <= b.y + b.height + 1,
      );
    })
    .toBe(true);
}

for (const viewport of viewports) {
  test(`guide preserves usable page scrolling at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/settings");
    await expect(
      page.getByRole("button", { name: "Connect backend", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Start guided tour", exact: true })
      .click();
    const scroll = page.getByTestId("workspace-scroll");
    await expect(page.getByTestId("guided-tour")).toBeAttached();
    expect(await scroll.evaluate((e) => e.clientHeight)).toBeGreaterThanOrEqual(
      200,
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollHeight <= innerHeight &&
            document.documentElement.scrollWidth <= innerWidth,
        ),
      )
      .toBe(true);
    await scroll.evaluate((e) => {
      e.scrollTop = 0;
    });
    const scrollBox = (await scroll.boundingBox())!;
    await page.mouse.move(scrollBox.x + 2, scrollBox.y + scrollBox.height - 2);
    await page.mouse.wheel(0, 500);
    await expect
      .poll(() => scroll.evaluate((e) => e.scrollTop))
      .toBeGreaterThan(0);
    await scroll.evaluate((e) => {
      e.scrollTop = 0;
    });
    await page
      .getByRole("button", { name: "View current guide", exact: true })
      .click();
    await page.getByRole("button", { name: "Next step", exact: true }).click();
    await expect(page.getByTestId("guided-tour")).toContainText("Step 2 of 30");
    await scroll.evaluate((e) => {
      e.scrollTop = 0;
    });
    await page.getByRole("button", { name: "Exit guide", exact: true }).click();
    await expect(page.getByTestId("guided-tour")).not.toBeAttached();
    if (viewport.width >= 1050) {
      const sidebar = page.getByTestId("sidebar-scroll");
      expect(
        await sidebar.evaluate((e) => e.scrollHeight > e.clientHeight),
      ).toBe(true);
      await sidebar.hover();
      await page.mouse.wheel(0, 900);
      await expect
        .poll(() => sidebar.evaluate((e) => e.scrollTop))
        .toBeGreaterThan(0);
      await expect(
        page.getByText("Felix's workspace", { exact: true }),
      ).toBeVisible();
    }
  });

  test(`dialogs reveal overflow and selected actions at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/docs");
    await page
      .getByRole("button", { name: "Workspace tools", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Workspace tools",
      exact: true,
    });
    const scroll = dialog.getByTestId("dialog-scroll");
    const box = await dialog.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    expect(await scroll.evaluate((e) => e.clientHeight)).toBeGreaterThanOrEqual(
      120,
    );
    const search = page.getByRole("textbox", {
      name: "Search workspace tools",
    });
    for (let i = 0; i < 8; i++) await search.press("ArrowDown");
    const last = dialog.getByRole("button", {
      name: "Start guided tour",
      exact: true,
    });
    await inside(last, scroll);
    expect(await scroll.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
    await search.press("Escape");
    await expect(dialog).not.toBeAttached();
    await page.getByRole("button", { name: "Help", exact: true }).click();
    const help = page.getByRole("dialog", {
      name: "Welcome to Pirate",
      exact: true,
    });
    await help
      .getByRole("button", { name: "How do I send a mission?", exact: true })
      .click();
    await expect(
      help.getByText(/On Overview, verify idle and fresh telemetry/),
    ).toBeVisible();
    const body = help.getByTestId("dialog-scroll");
    await body.evaluate((e) => {
      e.scrollTop = e.scrollHeight;
    });
    await inside(help.getByText(/Demo data is simulated/), body);
    await help
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await expect(help).not.toBeAttached();
    await page
      .getByRole("button", { name: "Notifications", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Fleet notifications", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Workspace tools", exact: true })
      .click();
    await expect(search).toHaveValue("");
    await inside(search, page.getByTestId("dialog-scroll"));
  });

  test(`expanded content and mission buttons remain reachable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of [
      "/",
      "/robots",
      "/missions",
      "/analytics",
      "/settings",
      "/logbook",
      "/docs",
      "/integrations",
    ]) {
      await page.goto(route);
      await expect(page.locator("#main-content")).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.scrollWidth <= innerWidth &&
              document.documentElement.scrollHeight <= innerHeight,
          ),
        )
        .toBe(true);
    }
    await page.goto("/docs");
    await page
      .getByRole("textbox", { name: "Search documentation" })
      .fill("keyboard");
    await page
      .getByRole("button", {
        name: "Read Use workspace tools and keyboard search",
      })
      .click();
    await expect(
      page.getByText(/Workspace tools opens a searchable navigation menu/),
    ).toBeVisible();
    await page.goto("/missions");
    await page
      .getByRole("button", { name: "Details", exact: true })
      .first()
      .click();
    const details = page.getByRole("dialog", {
      name: "Mission details",
      exact: true,
    });
    await expect(
      details.getByText("Activity timeline", { exact: true }),
    ).toBeAttached();
    await details.getByTestId("dialog-scroll").evaluate((e) => {
      e.scrollTop = e.scrollHeight;
    });
    await inside(
      details.getByText("Activity timeline", { exact: true }),
      details.getByTestId("dialog-scroll"),
    );
    await details
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page
      .getByRole("button", { name: "New mission", exact: true })
      .click();
    const dispatch = page.getByRole("dialog", {
      name: "Dispatch a new mission",
      exact: true,
    });
    await dispatch
      .getByRole("button", { name: "Station A", exact: true })
      .click();
    await expect(
      dispatch.getByRole("button", { name: "Station A", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await dispatch.getByTestId("dialog-scroll").evaluate((e) => {
      e.scrollTop = e.scrollHeight;
    });
    await inside(
      dispatch.getByRole("button", { name: "Dispatch mission", exact: true }),
      dispatch.getByTestId("dialog-scroll"),
    );
    expect(errors).toEqual([]);
  });
}
