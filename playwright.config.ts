import { defineConfig, devices } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: join(tmpdir(), "pirate-native-playwright-results"),
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: "list",
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:8081",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: "npm run preview:web",
        url: "http://localhost:8081",
        reuseExistingServer: !process.env.CI,
      },
});
