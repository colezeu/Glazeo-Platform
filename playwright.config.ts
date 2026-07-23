import { defineConfig, devices } from "@playwright/test";

const IS_CI = !!process.env.CI;

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
    // In CI: test against locally built + served dist (the actual commit)
    // Locally: test against Vite dev server
    baseURL: IS_CI ? "http://localhost:4173" : "http://localhost:5173",
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
  // CI: build + serve the production build locally
  // Local: use Vite dev server
  webServer: IS_CI
    ? [
        {
          command: "npm run build:e2e && npx vite preview --port 4173 --host 0.0.0.0",
          url: "http://localhost:4173",
          reuseExistingServer: false,
          timeout: 60_000,
        },
      ]
    : [
        {
          command: "npm run dev",
          url: "http://localhost:5173",
          reuseExistingServer: true,
        },
      ],
});
