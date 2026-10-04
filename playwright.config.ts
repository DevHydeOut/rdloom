import { defineConfig, devices } from "@playwright/test";

// Visual regression tests: every spec example, light and dark, against
// committed screenshots. Fonts render differently per OS, so baselines are
// kept per platform; only the Linux ones are committed and checked in CI.
export default defineConfig({
  testDir: "tests/visual",
  snapshotPathTemplate: "{testDir}/__screenshots__/{platform}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  expect: {
    // Same-OS renders are pixel-identical run to run, so any changed pixel is a real change.
    toHaveScreenshot: { maxDiffPixels: 0, threshold: 0.05, animations: "disabled", caret: "hide" },
  },
  use: {
    baseURL: "http://localhost:4180",
    locale: "en-US",
    timezoneId: "UTC",
    viewport: { width: 1024, height: 720 },
    deviceScaleFactor: 1,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 720 }, deviceScaleFactor: 1 } }],
  webServer: {
    command: "npm run build:docs --silent && npx vite preview apps/docs --port 4180 --strictPort",
    url: "http://localhost:4180",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
