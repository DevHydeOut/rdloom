import { defineConfig, devices } from "@playwright/test";

// Mounts every example of every block in apps/block-lab and fails on a render error,
// an empty render, a console error or an uncaught exception.
export default defineConfig({
  testDir: "tests/blocks",
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report-blocks" }]] : "list",
  use: { baseURL: "http://localhost:4200", locale: "en-US", timezoneId: "UTC", viewport: { width: 1280, height: 800 } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } }],
  webServer: {
    command: "npm run build -w @rdloom/block-lab --silent && npx vite preview apps/block-lab --port 4200 --strictPort",
    url: "http://localhost:4200",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
