import { defineConfig, devices } from "@playwright/test";

const IS_CI = !!process.env.CI;

// Tests always run against the E2E build (MockAuthGateway, zero Supabase).
// CI builds fresh; locally reuses existing dist if available.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: IS_CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    screenshot: "on",
    video: "on",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
    },
  ],
  webServer: [
    {
      command: "npm run build:e2e && npx vite preview --port 4173 --host 0.0.0.0",
      url: "http://localhost:4173",
      reuseExistingServer: !IS_CI,
      timeout: 60_000,
    },
  ],
});
