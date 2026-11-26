import { expect, test } from "@playwright/test";

test("documentation search filters, expands and resets without remote search", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.goto("/docs");
  const search = page.getByRole("textbox", { name: "Search documentation" });
  await search.fill("cancel emergency");
  await expect(
    page.getByRole("button", {
      name: "Read Cancel, do not assume emergency stop",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Read Cancel, do not assume emergency stop" })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Close Cancel, do not assume emergency stop",
    }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByText(/Cancel mission targets the exact active task/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Development", exact: true }).click();
  await expect(page.getByText(/No matching guides/)).toBeVisible();
  await page
    .getByRole("button", { name: "Clear documentation search" })
    .click();
  await expect(search).toHaveValue("");
  await expect(page.getByText(/10 guides/)).toBeVisible();
  expect(posts).toEqual([]);
});

test("workspace palette provides keyboard navigation and never dispatches", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.goto("/docs");
  await page
    .getByRole("button", { name: "Workspace tools", exact: true })
    .click();
  const search = page.getByRole("textbox", { name: "Search workspace tools" });
  await search.fill("backend");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(search).not.toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(search).toBeFocused();
  await search.fill("docs");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/docs$/);
  await page.keyboard.press("Control+k");
  await expect(search).toBeVisible();
  await search.fill("nothing matches");
  await expect(page.getByText(/No matching tools/)).toBeVisible();
  await search.press("Enter");
  await expect(search).toBeVisible();
  await search.press("Escape");
  await expect(search).not.toBeVisible();
  const docsSearch = page.getByRole("textbox", {
    name: "Search documentation",
  });
  await docsSearch.focus();
  await docsSearch.press("Control+k");
  await expect(search).not.toBeVisible();
  expect(posts).toEqual([]);
});

test("local insights are opt-in, memory-only and independent from remote trackers", async ({
  page,
}) => {
  const remote: string[] = [];
  page.on("request", (request) => {
    if (
      /google-analytics|googletagmanager|segment\.|amplitude\.|fullstory|hubspot|facebook\.|onetrust/i.test(
        request.url(),
      )
    )
      remote.push(request.url());
  });
  await page.goto("/integrations");
  const count = page.getByLabel("Help opened count", { exact: true });
  await expect(
    page.getByRole("button", { name: "Enable local insights" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(count).toHaveText("0");
  await page.getByRole("button", { name: "Enable local insights" }).click();
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(count).toHaveText("1");
  await page.getByRole("button", { name: "Clear insight counters" }).click();
  await expect(count).toHaveText("0");
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Disable local insights" }).click();
  await expect(count).toHaveText("0");
  await page.getByRole("button", { name: "Enable local insights" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Enable local insights" }),
  ).toBeVisible();
  await expect(count).toHaveText("0");
  expect(remote).toEqual([]);
});

test("new routes retain mobile layout, truthful capabilities and SEO boundaries", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of ["/docs", "/integrations"]) {
    await page.goto(route);
    await expect(page.locator("#main-content")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page
      .getByRole("button", { name: "Workspace tools", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Search workspace tools" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
  }
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
  await page
    .getByRole("textbox", { name: "Search free stack" })
    .fill("DocuSign");
  await expect(
    page.getByText("Mail, CRM and signatures", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("NOT CONNECTED", { exact: true })).toBeVisible();
  const docs = await request.get("/docs");
  expect(await docs.text()).toContain("Documentation");
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/docs</loc>");
  expect(await sitemap.text()).not.toContain("/integrations</loc>");
});
