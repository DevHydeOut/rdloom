import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    // The suite runs many jsdom files at once; a slow machine should not fail a test that only needs more time.
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
